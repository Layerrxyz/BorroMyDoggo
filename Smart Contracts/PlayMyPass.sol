// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./lib/IDelegationRegistry.sol";
import "./lib/IBAYCSewerPass.sol";

contract PlayMyPass is IERC721Receiver {

    struct PassData {
        uint16 passId;
        address passOwner;
        uint40 purchasePrice; // stored in GWEI
        uint32 hourlyRentalPrice; // stored in GWEI
        bool purchaseAllowed;
        bool rentalAllowed;
        bool boredPass; // for view functions, not stored in state
        bool dogPass; // for view functions, not stored in state
    }

    struct PassRental {
        uint16 passId;
        address renter;
        uint32 rentalEnd;
        uint32 hourlyRentalPrice;
        bool cannotExtend;
        bool boredPass; // for view functions, not stored in state
        bool dogPass; // for view functions, not stored in state
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
    /// @dev Thrown when renter tries to rent past max time
    error SewersClosing();
    
    PassData private CLEAR_PASS;
	
    address constant public SEWER_PASS = 0x764AeebcF425d56800eF2c84F2578689415a2DAa;
    IDelegationRegistry delegateCash = IDelegationRegistry(0x00000000000076A84feF008CDAbe6409d2FE638B);
    mapping(uint256 => PassData) public passData;
    mapping(uint256 => PassRental) public rentalData;
	
	uint256 constant public SEWERS_CLOSING = 1675814400; //February 8th, 12:00AM GMT, give pass owners time to get pass back in wallet & play before score freeze
    address constant public FEE_SPLITTER = 0x936Dd8afE0ca93BE3fadbb4B1c4BF1735e8b57da; //TODO: Update fee splitter address
    uint256 public constant FEE = 10;
    
    /// @dev store the deployer in case someone sends tokens to the contract without using safeTransferFrom
    address immutable DEPLOYER;
    
    constructor() {
        // set the deployer
        DEPLOYER = msg.sender;
    }


    /**
     * @notice Rents a Sewer Pass or extends rental for current renter
     * @param passId the sewer pass token ID being rented
     * @param rentalHours number of hours to rent the sewer pass for
     */
    function rentPass(uint256 passId, uint256 rentalHours) external payable {
        PassData memory pd = passData[passId];
        if(!pd.rentalAllowed) { revert PassNotAvailable(); } // revert if pass rental is disabled
        PassRental memory pr = rentalData[passId]; // load current rental data
        pr.passId = uint16(passId); //add passId to rental data, used later in UI functions

        if(pr.rentalEnd < block.timestamp) { // prior rental has expired
            if(pr.renter != msg.sender) { // new rental
                if(pr.renter != address(0)) { //revoke prior renter access if it exists
                    delegateCash.delegateForToken(pr.renter, SEWER_PASS, passId, false);
                }
                delegateCash.delegateForToken(msg.sender, SEWER_PASS, passId, true);
            }
            pr.renter = msg.sender; // set renter
            pr.rentalEnd = uint32(block.timestamp + rentalHours * 1 hours); // set rental end
        } else { // current rental still active
            if(pr.renter == msg.sender) { // extend rental
                pr.rentalEnd += uint32(rentalHours * 1 hours);
            } else { // deny rental
                revert PassCurrentlyRented();
            }
        }
        if(pr.rentalEnd > SEWERS_CLOSING) { revert SewersClosing(); }

        processRentalPayment(pd.passOwner, uint256(pd.hourlyRentalPrice), rentalHours); // pay pass owner
        rentalData[passId] = pr; // update state
    }



    /**
     * @notice Allows current renter for rented pass, or anyone for non-rented pass, to purchase a pass that the owner has set for sale
     * @param passId the sewer pass token ID being purchased
     */
    function purchasePass(uint256 passId) external payable {
        PassData memory pd = passData[passId];
        if(!pd.purchaseAllowed) { revert PassNotAvailable(); } // revert if pass purchase is disabled
        PassRental memory pr = rentalData[passId]; // load current rental data

        if(pr.renter != msg.sender && pr.rentalEnd > block.timestamp) { revert PassCurrentlyRented(); } // if currently rented, only current renter can purchase
        if(pr.renter != address(0)) { //clean up delegations
            delegateCash.delegateForToken(pr.renter, SEWER_PASS, passId, false);
        }

        processPurchasePayment(pd.passOwner, uint256(pd.purchasePrice)); // pay pass owner
        passData[passId] = CLEAR_PASS; // clean up state
        IERC721(SEWER_PASS).safeTransferFrom(address(this), msg.sender, passId); // transfer pass to purchaser
    }



    /**
     * @notice Internal function, converts calculates rental price, converts price from GWEI to WEI, checks payment amount, issues refund if necessary and sends payment to pass owner
     * @param passOwner the address of the pass holder to send payment to
     * @param hourlyRentalPrice the hourly rental price in GWEI for the sewer pass
     * @param rentalHours number of hours to rent the sewer pass for
     */
    function processRentalPayment(address passOwner, uint256 hourlyRentalPrice, uint256 rentalHours) internal {
        uint256 rentalCost = hourlyRentalPrice * rentalHours * 1 gwei; // calculate cost, convert gwei to wei
        refundIfOver(rentalCost);
        payPassOwner(passOwner, rentalCost);
    }

    /**
     * @notice Internal function, converts purchase price from GWEI to WEI, checks payment amount, issues refund if necessary and sends payment to pass owner
     * @param passOwner the address of the pass holder to send payment to
     * @param purchasePrice the purchase price for the sewer pass in GWEI
     */
    function processPurchasePayment(address passOwner, uint256 purchasePrice) internal {
        purchasePrice = purchasePrice * 1 gwei; //convert gwei to wei
        refundIfOver(purchasePrice);
        payPassOwner(passOwner, purchasePrice);
    }

    /**
     * @notice Send rental and purchase payments to pass owner, subtracts 10% FEE
     * @param passOwner the address of the pass holder to send payment to
     * @param price the total cost for the transaction
     */
    function payPassOwner(address passOwner, uint256 price) internal {
        uint256 providerFee = price * FEE / 100;
        uint256 payment = price - providerFee;
        (bool sent, ) = payable(passOwner).call{value: payment}("");
        require(sent);
        (sent, ) = payable(FEE_SPLITTER).call{value: providerFee}("");
        require(sent); 
    }

    /**
     * @notice Refund for overpayment on rental and purchases
     * @param price cost of the transaction
     */
    function refundIfOver(uint256 price) private {
        if(msg.value < price) { revert InsufficientPayment(); }
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    /**
     * @notice Withdraws sewer passes from contract, sewer pass cannot be withdrawn if actively rented
     * @param passIds the tokenIds of sewer passes to withdraw from the rental contract
     */
    function withdrawPasses(uint256[] calldata passIds) external {
        address passOwner;
        for(uint256 i = 0;i < passIds.length;i++) {
            if(!isOwnerOrDelegate(msg.sender, passIds[i])) { revert NotPassOwner(); } // revert if msg.sender is not the owner of the pass or delegate
            if(rentalData[passIds[i]].rentalEnd >= block.timestamp) { revert PassCurrentlyRented(); } // revert if pass is currently on rent
            passOwner = passData[passIds[i]].passOwner;
            passData[passIds[i]] = CLEAR_PASS; // clean up state
            IERC721(SEWER_PASS).safeTransferFrom(address(this), passOwner, passIds[i]); // transfer pass back to owner
        }
    }

    /**
     * @notice Deposits passes to PlayMyPass and sets parameters
     * @param passIds array of sewer pass IDs to deposit to the rental contract, pass owner must setApprovalForAll on Sewer Pass to the rental contract
     * @param purchaseAllowed set if the pass is available for purchase
     * @param purchasePrice set the purchase price for the pass, price is in GWEI
     * @param hourlyRentalPrice set the hourly rental price for the pass, price is in GWEI
     */
    function depositPasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, uint40[] calldata purchasePrice, uint32[] calldata hourlyRentalPrice) external {
        require(passIds.length == purchaseAllowed.length 
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);

        PassData memory pd;
        pd.passOwner = msg.sender;
        pd.rentalAllowed = true;

        for(uint256 i = 0;i < passIds.length;i++) {
            if(IERC721(SEWER_PASS).ownerOf(passIds[i]) != msg.sender) { revert NotPassOwner(); } // revert if msg.sender is not the pass owner

            pd.passId = uint16(passIds[i]);
            pd.purchaseAllowed = purchaseAllowed[i];
            pd.purchasePrice = purchasePrice[i];
            pd.hourlyRentalPrice = hourlyRentalPrice[i];

            passData[passIds[i]] = pd; // store pass rental parameters
            IERC721(SEWER_PASS).safeTransferFrom(msg.sender, address(this), passIds[i]); // transfer pass to rental contract
        }
    }


    /**
     * @notice Updates pass rental/purchase parameters
     * @param passIds array of sewer pass IDs to update rental parameters
     * @param purchaseAllowed set if the pass is available for purchase
     * @param rentalAllowed set if the pass is available for rent
     * @param purchasePrice set the purchase price for the pass, price is in GWEI
     * @param hourlyRentalPrice set the hourly rental price for the pass, price is in GWEI
     */
    function updatePasses(uint256[] calldata passIds, bool[] calldata purchaseAllowed, bool[] calldata rentalAllowed, uint40[] calldata purchasePrice, uint32[] calldata hourlyRentalPrice) external {
        require(passIds.length == rentalAllowed.length 
            && rentalAllowed.length == purchaseAllowed.length
            && purchaseAllowed.length == purchasePrice.length
            && purchasePrice.length == hourlyRentalPrice.length);
        
        PassData memory pd;
        for(uint256 i = 0;i < passIds.length;i++) {
            pd = passData[passIds[i]];

            if(!isOwnerOrDelegate(msg.sender, passIds[i])) { revert NotPassOwner(); } // revert if msg.sender is not the owner or delegate for the sewer pass

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
                Hot wallet delegate may update parameters after the pass is deposited by owner
     * @param operator account that initiated the safeTransferFrom
     * @param from account that owns the sewer pass and is transferring it into the rental contract
     * @param tokenId the tokenId for the sewer pass
     */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata) external returns (bytes4) {
        if(msg.sender != SEWER_PASS) { revert OnlySewerPass(); }
        if(operator != address(this)) { // if safeTransferFrom was not initiated by rental contract, store default parameters which do not allow for purchase or rental
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
        payable(FEE_SPLITTER).transfer(address(this).balance);
    }
    

    /**
     * @notice Returns an array of sewer pass tokens for specified address
     * @param owner the account to get a list of sewer pass tokenIds for
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
        uint256[] memory tmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;
        uint256 passTier;

        for(uint256 index = 0;index < tmpTokenIds.length;index++) {
            if((passData[tmpTokenIds[index]].rentalAllowed || passData[tmpTokenIds[index]].purchaseAllowed) && rentalData[tmpTokenIds[index]].rentalEnd < block.timestamp) {
                tmpPasses[tmpIndex] = passData[tmpTokenIds[index]];
                (passTier,,) = IBAYCSewerPass(SEWER_PASS).getMintDataByTokenId(tmpTokenIds[index]);
                tmpPasses[tmpIndex].boredPass = (passTier > 2);
                tmpPasses[tmpIndex].dogPass = (passTier % 2 == 0);
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
     * @param owner the account to list sewer passes deposited to the rental contract
     */
    function myPassesForRent(address owner) external view returns(PassData[] memory passes) {
        PassData[] memory tmpPasses = new PassData[](1000);
        uint256[] memory tmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;
        uint256 passTier;

        for(uint256 index = 0;index < tmpTokenIds.length;index++) {
            if(isOwnerOrDelegate(owner, tmpTokenIds[index])) {
                tmpPasses[tmpIndex] = passData[tmpTokenIds[index]];
                (passTier,,) = IBAYCSewerPass(SEWER_PASS).getMintDataByTokenId(tmpTokenIds[index]);
                tmpPasses[tmpIndex].boredPass = (passTier > 2);
                tmpPasses[tmpIndex].dogPass = (passTier % 2 == 0);
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
     * @param owner the address to check 
     */
    function myPassesRented(address owner) external view returns(PassRental[] memory rentals) {
        PassRental[] memory tmpRentals = new PassRental[](1000);
        uint256[] memory tmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;
        uint256 passTier;

        for(uint256 index = 0;index < tmpTokenIds.length;index++) {
            if(rentalData[tmpTokenIds[index]].rentalEnd >= block.timestamp && isOwnerOrDelegate(owner, tmpTokenIds[index])) {
                tmpRentals[tmpIndex] = rentalData[tmpTokenIds[index]];
                tmpRentals[tmpIndex].hourlyRentalPrice = passData[tmpTokenIds[index]].hourlyRentalPrice;
                tmpRentals[tmpIndex].cannotExtend = !passData[tmpTokenIds[index]].rentalAllowed;
                (passTier,,) = IBAYCSewerPass(SEWER_PASS).getMintDataByTokenId(tmpTokenIds[index]);
                tmpRentals[tmpIndex].boredPass = (passTier > 2);
                tmpRentals[tmpIndex].dogPass = (passTier % 2 == 0);
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
     * @param renter the address to check for active rentals
     */
    function myRentals(address renter) external view returns(PassRental[] memory rentals) {
        PassRental[] memory tmpRentals = new PassRental[](1000);
        uint256[] memory tmpTokenIds = this.sewerpassTokenIds(address(this));
        uint256 tmpIndex = 0;
        uint256 passTier;

        for(uint256 index = 0;index < tmpTokenIds.length;index++) {
            if(rentalData[tmpTokenIds[index]].rentalEnd >= block.timestamp && rentalData[tmpTokenIds[index]].renter == renter) {
                tmpRentals[tmpIndex] = rentalData[tmpTokenIds[index]];
                tmpRentals[tmpIndex].hourlyRentalPrice = passData[tmpTokenIds[index]].hourlyRentalPrice;
                tmpRentals[tmpIndex].cannotExtend = !passData[tmpTokenIds[index]].rentalAllowed;
                (passTier,,) = IBAYCSewerPass(SEWER_PASS).getMintDataByTokenId(tmpTokenIds[index]);
                tmpRentals[tmpIndex].boredPass = (passTier > 2);
                tmpRentals[tmpIndex].dogPass = (passTier % 2 == 0);
                tmpIndex++;
            }
        }

        rentals = new PassRental[](tmpIndex);
        for(uint256 index = 0;index < tmpIndex;index++) {
            rentals[index] = tmpRentals[index];
        }
    }

    
    /**
     * @notice check to see if operator is owner or delegate via delegate cash
     * @param operator the address of the account to check for access
     * @param passId the tokenId of the sewer pass
     */
    function isOwnerOrDelegate(
        address operator,
        uint256 passId
    ) internal view returns (bool) {
        address tokenOwner = passData[passId].passOwner;

        return (operator == tokenOwner ||
            delegateCash.checkDelegateForToken(
                    operator,
                    tokenOwner,
                    SEWER_PASS,
                    passId
                ));
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