// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./lib/IDelegationRegistry.sol";

contract PlayMyPass is IERC721Receiver {

    struct PassData {
        uint16 passId;
        address passOwner;
        uint40 purchasePrice; // stored in GWEI
        uint32 hourlyRentalPrice; // stored in GWEI
        bool purchaseAllowed;
        bool rentalAllowed;
    }

    struct PassRental {
        uint16 passId;
        address renter;
        uint32 rentalEnd;
        uint32 hourlyRentalPrice;
        bool cannotExtend;
    }

    /// @dev Thrown when an ERC721 that is not the SewerPass tries to call onERC721Received
    error OnlySewerPass();
    /// @dev Thrown when someone attempts to deposit, withdraw or update a pass they do not own
    error NotPassOwner();
    /// @dev Thrown when attempting to rent or purchase and a pass owner has disabled rent/purchase
    error PassNotAvailable();
    /// @dev Thrown when attempting to rent or purchase and the pass is already rented, or withdraw a pass that is currently rented
    error PassCurrentlyRented();
    /// @dev Thrown when attempting to rent or purchase and msg.value is insufficent
    error InsufficientPayment();
    /// @dev Thrown when a caller that is not the deployer tries to call the rescueToken function
    error OnlyDeployer();
    /// @dev Thrown when the deployer tries to "rescue" the sponsored token
    error CannotRescueOwnedToken();
    
    PassData private CLEAR_PASS;
	
    address constant public SEWER_PASS = 0x764AeebcF425d56800eF2c84F2578689415a2DAa;
    IDelegationRegistry delegateCash = IDelegationRegistry(0x00000000000076A84feF008CDAbe6409d2FE638B);
    mapping(uint256 => PassData) public passData;
    mapping(uint256 => PassRental) public rentalData;
	
	
    address constant public LAYERRXYZ = 0x936Dd8afE0ca93BE3fadbb4B1c4BF1735e8b57da;
    address constant public PAT = 0xE9bC3058A30E14C2Ba6a4fD6B49684237A67aF56;
    address constant public JUSTADEV = 0x3e6a203ab73C4B35Be1F65461D88Fb21DE26446e;
    address constant public JOSHONG = 0xaf469C4a0914938e6149CF621c54FB4b1EC0c202;
    uint256 public constant FEE = 10;
    uint256 public layerrEarnings = 0;
    
    /// @dev store the deployer in case someone sends tokens to the contract without using safeTransferFrom
    address immutable DEPLOYER;
    
    constructor() {
        // set the deployer
        DEPLOYER = msg.sender;
    }


    /**
     * @notice Rents a Sewer Pass or extends rental for current renter
     */
    function rentPass(uint256 passId, uint256 rentalHours) external payable {
        PassData memory pd = passData[passId];
        if(!pd.rentalAllowed) { revert PassNotAvailable(); }
        PassRental memory pr = rentalData[passId];
        pr.passId = uint16(passId);
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
                revert PassCurrentlyRented();
            }
        }
        processRentalPayment(pd.passOwner, uint256(pd.hourlyRentalPrice), rentalHours);
        rentalData[passId] = pr;
    }



    /**
     * @notice Allows current renter for rented pass, or anyone for non-rented pass, to purchase a pass that the owner has set for sale
     */
    function purchasePass(uint256 passId) external payable {
        PassData memory pd = passData[passId];
        if(!pd.purchaseAllowed) { revert PassNotAvailable(); }
        PassRental memory pr = rentalData[passId];
        if(pr.renter != msg.sender && pr.rentalEnd < block.timestamp) { revert PassCurrentlyRented(); }
        if(pr.renter != address(0)) { //clean up delegations
            delegateCash.delegateForToken(pr.renter, SEWER_PASS, passId, false);
        }
        processPurchasePayment(pd.passOwner, uint256(pd.purchasePrice));
        passData[passId] = CLEAR_PASS;
        IERC721(SEWER_PASS).safeTransferFrom(address(this), msg.sender, passId);
    }



    /**
     * @notice Internal function, converts calculates rental price, converts price from GWEI to WEI, checks payment amount, issues refund if necessary and sends payment to pass owner
     */
    function processRentalPayment(address passOwner, uint256 hourlyRentalPrice, uint256 rentalHours) internal {
        uint256 rentalCost = hourlyRentalPrice * rentalHours * 1 gwei; // calculate cost, convert gwei to wei
        refundIfOver(rentalCost);
        payPassOwner(passOwner, rentalCost);
    }

    /**
     * @notice Internal function, converts purchase price from GWEI to WEI, checks payment amount, issues refund if necessary and sends payment to pass owner
     */
    function processPurchasePayment(address passOwner, uint256 purchasePrice) internal {
        purchasePrice = purchasePrice * 1 gwei; //convert gwei to wei
        refundIfOver(purchasePrice);
        payPassOwner(passOwner, purchasePrice);
    }

    /**
     * @notice Send rental and purchase payments to pass owner, subtracts 10% FEE
     */
    function payPassOwner(address passOwner, uint256 price) internal {
        uint256 payment = price * FEE / 100;
        (bool sent, ) = payable(passOwner).call{value: payment}("");
        require(sent);
    }



    /**
     * @notice Refund for overpayment on rental and purchases
     */
    function refundIfOver(uint256 price) private {
        if(msg.value < price) { revert InsufficientPayment(); }
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }



    /**
     * @notice Withdraws sewer passes from contract
     */
    function withdrawPasses(uint256[] calldata passIds) external {
        for(uint256 i = 0;i < passIds.length;i++) {
            if(passData[passIds[i]].passOwner != msg.sender) { revert NotPassOwner(); }
            if(rentalData[passIds[i]].rentalEnd >= block.timestamp) { revert PassCurrentlyRented(); }
            passData[passIds[i]] = CLEAR_PASS;
            IERC721(SEWER_PASS).safeTransferFrom(address(this), msg.sender, passIds[i]);
        }
    }


    /**
     * @notice Deposits passes to PlayMyPass and sets parameters
     */
    function depositPasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, uint40[] calldata purchasePrice, uint32[] calldata hourlyRentalPrice) external {
        require(passIds.length == purchaseAllowed.length 
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);

        PassData memory pd;
        pd.passOwner = msg.sender;
        pd.rentalAllowed = true;

        for(uint256 i = 0;i < passIds.length;i++) {
            if(IERC721(SEWER_PASS).ownerOf(passIds[i]) != msg.sender) { revert NotPassOwner(); }
            pd.passId = uint16(passIds[i]);
            pd.purchaseAllowed = purchaseAllowed[i];
            pd.purchasePrice = purchasePrice[i];
            pd.hourlyRentalPrice = hourlyRentalPrice[i];
            passData[passIds[i]] = pd;
            IERC721(SEWER_PASS).safeTransferFrom(msg.sender, address(this), passIds[i]);
        }
    }


    /**
     * @notice Updates pass rental/purchase parameters
     */
    function updatePasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, bool[] calldata rentalAllowed, uint40[] calldata purchasePrice, uint32[] calldata hourlyRentalPrice) external {
        require(passIds.length == rentalAllowed.length 
            && rentalAllowed.length == purchaseAllowed.length
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);
        
        PassData memory pd;
        for(uint256 i = 0;i < passIds.length;i++) {
            pd = passData[passIds[i]];

            if(pd.passOwner != msg.sender) { revert NotPassOwner(); }
            pd.purchaseAllowed = purchaseAllowed[i];
            pd.rentalAllowed = rentalAllowed[i];
            pd.purchasePrice = purchasePrice[i];
            pd.hourlyRentalPrice = hourlyRentalPrice[i];
            passData[passIds[i]] = pd;
        }
    }



    /**
     * @notice Receives sewer pass
                If transfer was not initiated by PlayMyPass contract, sets default values that do not allow purchase or rental
     */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata) external returns (bytes4) {
        if(msg.sender != SEWER_PASS) { revert OnlySewerPass(); }
        if(operator != address(this)) {
            PassData memory pd;
            pd.passId = uint16(tokenId);
            pd.passOwner = from;
            passData[tokenId] = pd;
        }
        return IERC721Receiver.onERC721Received.selector;
    }



    /**
     * @notice Withdraws fees collected
     */
    function withdraw() external {
        uint256 balance = address(this).balance;
        uint256 justadev = balance * 25 / 100;
        uint256 layerrxyz = balance * 25 / 100;
        uint256 joshong = balance * 25 / 100;
        uint256 pat = balance - justadev - layerrxyz - joshong;
        payable(JOSHONG).transfer(joshong);
        payable(JUSTADEV).transfer(justadev);
        payable(LAYERRXYZ).transfer(layerrxyz);
        payable(PAT).transfer(pat);
    }
    

    /**
     * @notice Returns an array of sewer pass tokens for specified address
     */
    function sewerpassTokenIds(address owner) external view returns(uint256[] memory tokenIds) {
        uint256 balance = IERC721(SEWER_PASS).balanceOf(owner);
        tokenIds = new uint256[](balance);
        for(uint256 tokenIndex = 0;tokenIndex < balance;tokenIndex++) {
            tokenIds[tokenIndex] = IERC721Enumerable(SEWER_PASS).tokenOfOwnerByIndex(owner, tokenIndex);
        }
    }

    /**
     * @notice Returns an array of sewer passes that are currently available to rent
     */
    function availableToRent() external view returns(PassData[] memory passes) {
        PassData[] memory tmpPasses = new PassData[](1000);
        uint256[] memory pmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;

        for(uint256 index = 0;index < pmpTokenIds.length;index++) {
            if(passData[pmpTokenIds[index]].rentalAllowed && rentalData[pmpTokenIds[index]].rentalEnd < block.timestamp) {
                tmpPasses[tmpIndex] = passData[pmpTokenIds[index]];
                tmpIndex++;
            }
        }

        passes = new PassData[](tmpIndex);
        for(uint256 index = 0;index < tmpIndex;index++) {
            passes[index] = tmpPasses[index];
        }
    }

    /**
     * @notice Returns an array of active passes owned by address
     */
    function myPassesForRent(address owner) external view returns(PassData[] memory passes) {
        PassData[] memory tmpPasses = new PassData[](1000);
        uint256[] memory pmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;

        for(uint256 index = 0;index < pmpTokenIds.length;index++) {
            if(passData[pmpTokenIds[index]].passOwner == owner) {
                tmpPasses[tmpIndex] = passData[pmpTokenIds[index]];
                tmpIndex++;
            }
        }

        passes = new PassData[](tmpIndex);
        for(uint256 index = 0;index < tmpIndex;index++) {
            passes[index] = tmpPasses[index];
        }
    }

    /**
     * @notice Returns an array of active pass rentals, includes cost to extend rental and if it can be extended
     */
    function myPassesRented(address owner) external view returns(PassRental[] memory rentals) {
        PassRental[] memory tmpRentals = new PassRental[](1000);
        uint256[] memory pmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;

        for(uint256 index = 0;index < pmpTokenIds.length;index++) {
            if(rentalData[pmpTokenIds[index]].rentalEnd >= block.timestamp && passData[pmpTokenIds[index]].passOwner == owner) {
                tmpRentals[tmpIndex] = rentalData[pmpTokenIds[index]];
                tmpRentals[tmpIndex].hourlyRentalPrice = passData[pmpTokenIds[index]].hourlyRentalPrice;
                tmpRentals[tmpIndex].cannotExtend = !passData[pmpTokenIds[index]].rentalAllowed;
                tmpIndex++;
            }
        }

        rentals = new PassRental[](tmpIndex);
        for(uint256 index = 0;index < tmpIndex;index++) {
            rentals[index] = tmpRentals[index];
        }
    }

    /**
     * @notice Returns an array of active pass rentals, includes cost to extend rental and if it can be extended
     */
    function myRentals(address renter) external view returns(PassRental[] memory rentals) {
        PassRental[] memory tmpRentals = new PassRental[](1000);
        uint256[] memory pmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;

        for(uint256 index = 0;index < pmpTokenIds.length;index++) {
            if(rentalData[pmpTokenIds[index]].rentalEnd >= block.timestamp && rentalData[pmpTokenIds[index]].renter == renter) {
                tmpRentals[tmpIndex] = rentalData[pmpTokenIds[index]];
                tmpRentals[tmpIndex].hourlyRentalPrice = passData[pmpTokenIds[index]].hourlyRentalPrice;
                tmpRentals[tmpIndex].cannotExtend = !passData[pmpTokenIds[index]].rentalAllowed;
                tmpIndex++;
            }
        }

        rentals = new PassRental[](tmpIndex);
        for(uint256 index = 0;index < tmpIndex;index++) {
            rentals[index] = tmpRentals[index];
        }
    }

    /**
     * @notice Rescue tokens that were sent to this contract without using safeTransferFrom. Only callable by the
     *         deployer, and disallows the deployer from removing the sponsored token.
               Borrowed from emo.eth Dookey4All
     */
    function rescueToken(address tokenAddress, bool erc20, uint256 id) external {
        // restrict to deployer
        if (msg.sender != DEPLOYER) {
            revert OnlyDeployer();
        }
        if (erc20) {
            // transfer entire ERC20 balance to the deployer
            IERC20(tokenAddress).transfer(msg.sender, IERC20(tokenAddress).balanceOf(address(this)));
        } else {
            // allow rescuing sewer pass tokens, but not the sponsored token
            // sewer pass tokens which are *not* the sponsored token can be transferred using normal transferFrom
            // but the onERC721Received callback will not be invoked to register them as the sponsored token, so they
            // cannot be withdrawn otherwise
            if (tokenAddress == address(SEWER_PASS) && passData[id].passOwner != address(0)) {
                revert CannotRescueOwnedToken();
            }
            // transfer the token to the deployer
            IERC721(tokenAddress).transferFrom(address(this), msg.sender, id);
        }
        // no need to cover ERC1155 since they only implement safeTransferFrom, and this contract will reject them all
        // same with ether as there are no payable methods; those who selfdestruct, etc funds should expect to lose them
    }
}