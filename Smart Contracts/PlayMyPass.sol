// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./lib/IDelegationRegistry.sol";

contract PlayMyPass is IERC721Receiver {

    struct PassData {
        address passOwner;
        uint40 purchasePrice; // stored in GWEI
        uint40 hourlyRentalPrice; // stored in GWEI
        bool purchaseAllowed;
        bool rentalAllowed;
    }

    struct PassRental {
        address renter;
        uint32 rentalEnd;
    }
    
    address constant public SEWER_PASS = 0x764AeebcF425d56800eF2c84F2578689415a2DAa;
    IDelegationRegistry delegateCash = IDelegationRegistry(0x00000000000076A84feF008CDAbe6409d2FE638B);
    mapping(uint256 => PassData) public passData;
    mapping(uint256 => PassRental) public rentalData;
    uint256 public constant FEE = 10;
    PassData private CLEAR_PASS;
    

    function rentPass(uint256 passId, uint256 rentalHours) external payable {
        PassData memory pd = passData[passId];
        require(pd.rentalAllowed, "PASS NOT AVAILABLE TO RENT");
        PassRental memory pr = rentalData[passId];
        if(pr.rentalEnd < block.timestamp) {
            if(pr.renter != msg.sender) { // extend rental
                if(pr.renter != address(0)) { //revoke prior renter access
                    delegateCash.delegateForToken(pr.renter, SEWER_PASS, passId, false);
                }
                delegateCash.delegateForToken(msg.sender, SEWER_PASS, passId, true);
            }
            pr.renter = msg.sender;
            pr.rentalEnd = uint32(block.timestamp + rentalHours * 1 hours);
        } else {
            if(pr.renter == msg.sender) { // extend rental
                pr.rentalEnd += uint32(rentalHours * 1 hours);
            } else {
                revert("PASS IS CURRENTLY RENTED");
            }
        }
        processRentalPayment(pd.passOwner, uint256(pd.hourlyRentalPrice), rentalHours);
        rentalData[passId] = pr;
    }

    function purchasePass(uint256 passId) external payable {
        PassData memory pd = passData[passId];
        require(pd.purchaseAllowed, "PASS NOT AVAILABLE TO PURCHASE");
        PassRental memory pr = rentalData[passId];
        require(pr.renter == msg.sender || pr.rentalEnd < block.timestamp, "CANNOT PURCHASE WHILE SOMEONE ELSE IS RENTING");
        if(pr.renter != address(0)) { //clean up delegations
            delegateCash.delegateForToken(pr.renter, SEWER_PASS, passId, false);
        }
        processPurchasePayment(pd.passOwner, uint256(pd.purchasePrice));
        passData[passId] = CLEAR_PASS;
        IERC721(SEWER_PASS).safeTransferFrom(address(this), msg.sender, passId);
    }

    function processRentalPayment(address passOwner, uint256 hourlyRentalPrice, uint256 rentalHours) internal {
        uint256 rentalCost = hourlyRentalPrice * rentalHours * 1 gwei; // calculate cost, convert gwei to wei
        refundIfOver(rentalCost);
        payPassOwner(passOwner, rentalCost);
    }

    function processPurchasePayment(address passOwner, uint256 purchasePrice) internal {
        purchasePrice = purchasePrice * 1 gwei; //convert gwei to wei
        refundIfOver(purchasePrice);
        payPassOwner(passOwner, purchasePrice);
    }

    /** send payment to pass owner
    */
    function payPassOwner(address passOwner, uint256 price) internal {
        uint256 payment = price * FEE / 100;
        (bool sent, ) = payable(passOwner).call{value: payment}("");
        require(sent);
    }

    /** refund overpayment
    */
    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "INSUFFICIENT PAYMENT");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    function withdrawPasses(uint256[] calldata passIds) external {
        for(uint256 i = 0;i < passIds.length;i++) {
            require(passData[passIds[i]].passOwner == msg.sender);
            require(rentalData[passIds[i]].rentalEnd < block.timestamp);
            passData[passIds[i]] = CLEAR_PASS;
            IERC721(SEWER_PASS).safeTransferFrom(address(this), msg.sender, passIds[i]);
        }
    }

    function depositPasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, uint40[] calldata purchasePrice, uint40[] calldata hourlyRentalPrice) external {
        require(passIds.length == purchaseAllowed.length 
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);

        PassData memory pd;
        pd.passOwner = msg.sender;
        pd.rentalAllowed = true;

        for(uint256 i = 0;i < passIds.length;i++) {
            require(IERC721(SEWER_PASS).ownerOf(passIds[i]) == msg.sender);
            pd.purchaseAllowed = purchaseAllowed[i];
            pd.purchasePrice = purchasePrice[i];
            pd.hourlyRentalPrice = hourlyRentalPrice[i];
            passData[passIds[i]] = pd;
            IERC721(SEWER_PASS).safeTransferFrom(msg.sender, address(this), passIds[i]);
        }
    }

    function updatePasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, bool[] calldata rentalAllowed, uint40[] calldata purchasePrice, uint40[] calldata hourlyRentalPrice) external {
        require(passIds.length == rentalAllowed.length 
            && rentalAllowed.length == purchaseAllowed.length
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);
        
        PassData memory pd;
        for(uint256 i = 0;i < passIds.length;i++) {
            pd = passData[passIds[i]];

            require(pd.passOwner == msg.sender);
            pd.purchaseAllowed = purchaseAllowed[i];
            pd.rentalAllowed = rentalAllowed[i];
            pd.purchasePrice = purchasePrice[i];
            pd.hourlyRentalPrice = hourlyRentalPrice[i];
            passData[passIds[i]] = pd;
        }
    }

    /** receives sewer pass from sewer pass mint function, transfers to current minter
    */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata) external returns (bytes4) {
        require(msg.sender == SEWER_PASS);
        if(operator != address(this)) {
            PassData memory pd;
            pd.passOwner = from;
            passData[tokenId] = pd;
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}