// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./lib/IBAYCSewerPassClaim.sol";
import "./lib/IDelegationRegistry.sol";

contract RentADawg is IERC721Receiver, ReentrancyGuard {
    using BitMaps for BitMaps.BitMap;

    address constant public SEWER_PASS = 0x764AeebcF425d56800eF2c84F2578689415a2DAa;
    address constant public SEWER_PASS_CLAIM = 0xBA5a9E9CBCE12c70224446C24C111132BECf9F1d;
    address constant public BAYC = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D;
    address constant public MAYC = 0x60E4d786628Fea6478F785A6d7e704777c86a7c6;
    address constant public BAKC = 0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623;
    address constant public BAKC = 0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623;
    address payable constant public LAYERRXYZ = 0x936Dd8afE0ca93BE3fadbb4B1c4BF1735e8b57da;
    address payable constant public PAT = 0xE9bC3058A30E14C2Ba6a4fD6B49684237A67aF56;
    address payable constant public JUSTADEV = 0x3e6a203ab73C4B35Be1F65461D88Fb21DE26446e;
    uint64 constant public LENDER_FEE = 50;
    IDelegationRegistry delegateCash = IDelegationRegistry(0x00000000000076A84feF008CDAbe6409d2FE638B);

    uint256 public layerrEarnings = 0;

    BitMaps.BitMap private doggoLoaned;
    mapping(uint256 => uint256) public borroCost;
    address private currentMinter;

    /** borroDoggos allows bayc/mayc holder to mint tier 4/tier 2 sewer pass
        apes must be delegated to this contract address by ape owner using delegate.cash
        using doggo delegated and loaned by a doggo holder
        payment must be greater than or equal to sum of all doggos used and can be calculated with calculateBorroCost
        sewer passes will be minted and transfered to the account that calls this function
        minter must be direct owner or delegate for the BAYC/MAYC tokens supplied
        BAYC or MAYC can be supplied as empty arrays but total apes must equal total doggos
        90% of borro fees go to doggo owner, 5% to 0xfoobar for delegate.cash and 5% to 0xth0mas
    */
    function borroDoggos(uint256[] calldata baycIds, uint256[] calldata maycIds, uint256[] calldata doggoIds) external payable nonReentrant {
        require((baycIds.length + maycIds.length) == doggoIds.length, "APE/DOGGO COUNT MISMATCH");
        uint256 totalBorroCost = this.calculateBorroCost(doggoIds);
        require(msg.value >= totalBorroCost, "INSUFFICIENT PAYMENT");
        uint256 doggoIndex = 0;
        currentMinter = msg.sender;
        address apeOwner;
        for(uint256 i = 0;i < baycIds.length;i++) {
            apeOwner = IERC721(BAYC).ownerOf(baycIds[i]);
            require(apeOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, apeOwner, BAYC, baycIds[i]), "NOT APE OWNER OR DELEGATE");
            IBAYCSewerPassClaim(SEWER_PASS_CLAIM).claimBaycBakc(baycIds[i], doggoIds[doggoIndex]);
            payDoggoOwner(doggoIds[doggoIndex]);
            doggoIndex++;
        }
        for(uint256 i = 0;i < maycIds.length;i++) {
            apeOwner = IERC721(MAYC).ownerOf(maycIds[i]);
            require(apeOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, apeOwner, MAYC, maycIds[i]), "NOT APE OWNER OR DELEGATE");
            IBAYCSewerPassClaim(SEWER_PASS_CLAIM).claimMaycBakc(maycIds[i], doggoIds[doggoIndex]);
            payDoggoOwner(doggoIds[doggoIndex]);
            doggoIndex++;
        }
        currentMinter = address(0);
    }

    /** calculate and send payment for use of doggo in minting sewer pass, cleans up state
    */
    function payDoggoOwner(uint256 doggoId) internal {
        address doggoOwner = IERC721(BAKC).ownerOf(doggoId);
        uint256 payment = borroCost[doggoId] * LENDER_FEE / 100;
        (bool sent, ) = payable(doggoOwner).call{value: payment}("");
        require(sent);
        borroCost[doggoId] = 0;
        doggoLoaned.unset(this.getDoggoLoanIndex(doggoOwner, doggoId));
    }

    /** withdraw fees for 0xfoobar and 0xth0mas
    */
    // write me a withdraw function that sends all ether to LAYERRXYZ until 5 ether has been sent to LAYERRXYZ then splits the ether with 3 percent to JUSTADEV, 25% to Layerrxyz, 25% to Pat, 25% to Layerrxyz, and the remaining to PAT
    
    function withdraw() external {
        uint256 balance = address(this).balance;
        if (layerrEarnings < 5 ether) {
            if (balance + layerrEarnings < 5 ether) {
                LAYERRXYZ.transfer(balance);
                layerrEarnings += balance;
            } else {
                uint256 remainingOwed = 5 ether - layerrEarnings;
                LAYERRXYZ.transfer(remainingOwed);
                layerrEarnings += remainingOwed;
                balance -= remainingOwed;
                uint256 justadev = balance * 3 / 100;
                uint256 layerrxyz = balance * 25 / 100;
                uint256 pat = balance - justadev - layerrxyz;
                JUSTADEV.transfer(justadev);
                LAYERRXYZ.transfer(layerrxyz);
                PAT.transfer(pat);
            }
        } else {
            uint256 justadev = balance * 3 / 100;
            uint256 layerrxyz = balance * 25 / 100;
            uint256 pat = balance - justadev - layerrxyz;
            JUSTADEV.transfer(justadev);
            LAYERRXYZ.transfer(layerrxyz);
            PAT.transfer(pat);
        }
    }

    /** loan doggos for bayc/mayc to mint higher tier sewer passes
        doggos must be delegated to this contract address by doggo owner using delegate.cash
        doggoIds = array of doggos to loan out, must be direct owner or delegate to call
        costToBorro = payment to be received when your doggo is used to mint a sewer pass, cost is in WEI
        payment will be sent to doggo owner wallet
        can be called again to adjust costToBorro
    */
    function loanDoggos(uint256[] calldata doggoIds, uint256 costToBorro) external {
        address doggoOwner;
        for(uint256 doggoIndex = 0;doggoIndex < doggoIds.length;doggoIndex++) {
            doggoOwner = IERC721(BAKC).ownerOf(doggoIds[doggoIndex]);
            require(doggoOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, doggoOwner, BAKC, doggoIds[doggoIndex]), "NOT DOGGO OWNER OR DELEGATE");
            doggoLoaned.set(this.getDoggoLoanIndex(doggoOwner, doggoIds[doggoIndex]));
            borroCost[doggoIds[doggoIndex]] = costToBorro;
        }
    }

    /** takes doggo off loan, you can also revoke delegation to this contract with delegate.cash for same effect
    */
    function unloanDoggos(uint256[] calldata doggoIds) external {
        address doggoOwner;
        for(uint256 doggoIndex = 0;doggoIndex < doggoIds.length;doggoIndex++) {
            doggoOwner = IERC721(BAKC).ownerOf(doggoIds[doggoIndex]);
            require(doggoOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, doggoOwner, BAKC, doggoIds[doggoIndex]), "NOT DOGGO OWNER OR DELEGATE");
            doggoLoaned.unset(this.getDoggoLoanIndex(doggoOwner, doggoIds[doggoIndex]));
            borroCost[doggoIds[doggoIndex]] = 0;
        }
    }

    struct DoggoLoaned {
        uint64 doggoId;
        uint64 borroCost;
    }

    /** utility function to return list of available doggos for sewer pass minting and cost to borro for each doggo
        find cheapest doggo ids to borrow and supply array to calculateBorroCost for total cost
    */
    function availableDoggos() external view returns(DoggoLoaned[] memory) {
        uint256 doggosAvailable = 0;
        address doggoOwner;
        for(uint256 doggoIndex = 0;doggoIndex < 10000;doggoIndex++) {
            try IERC721(BAKC).ownerOf(doggoIndex) returns (address result) { doggoOwner = result; } catch { doggoOwner = address(0); }
            if(doggoLoaned.get(this.getDoggoLoanIndex(doggoOwner, doggoIndex)) && 
              delegateCash.checkDelegateForToken(address(this), doggoOwner, BAKC, doggoIndex) &&
              !IBAYCSewerPassClaim(SEWER_PASS_CLAIM).bakcClaimed(doggoIndex)) {
                doggosAvailable++;
            }
        }

        DoggoLoaned[] memory loans = new DoggoLoaned[](doggosAvailable);
        uint256 currentIndex = 0;
        for(uint256 doggoIndex = 0;doggoIndex < 10000;doggoIndex++) {
            try IERC721(BAKC).ownerOf(doggoIndex) returns (address result) { doggoOwner = result; } catch { doggoOwner = address(0); }
            if(doggoLoaned.get(this.getDoggoLoanIndex(doggoOwner, doggoIndex)) && 
              delegateCash.checkDelegateForToken(address(this), doggoOwner, BAKC, doggoIndex) &&
              !IBAYCSewerPassClaim(SEWER_PASS_CLAIM).bakcClaimed(doggoIndex)) {
                  DoggoLoaned memory dl;
                  dl.doggoId = uint64(doggoIndex);
                  dl.borroCost = uint64(borroCost[doggoIndex]);
                loans[currentIndex] = dl;
                currentIndex++;
                if(currentIndex >= doggosAvailable) { break; }
            }
        }
        return loans;
    }

    /** offset doggoId by owner address for loan mapping,
        ensures that doggo transfer and subsequent delegation
        by new owner does not enable a boost sale at previous
        listing
    */
    function getDoggoLoanIndex(address doggoOwner, uint256 doggoId) external pure returns(uint256 doggoLoanIndex) {
        doggoLoanIndex = uint256(uint160(doggoOwner)) + doggoId;
    }

    /** calculates total cost of doggo borrowing
    */
    function calculateBorroCost(uint256[] calldata doggoIds) external view returns(uint256 totalBorroCost) {
        address doggoOwner;
        for(uint256 i = 0;i < doggoIds.length;i++) {
            try IERC721(BAKC).ownerOf(doggoIds[i]) returns (address result) { doggoOwner = result; } catch { doggoOwner = address(0); }
            require(doggoLoaned.get(this.getDoggoLoanIndex(doggoOwner, doggoIds[i])), "DOGGO NOT LOANED");
            totalBorroCost += borroCost[doggoIds[i]];
        }
    }

    /** receives sewer pass from sewer pass mint function, transfers to current minter
    */
    function onERC721Received(address operator, address, uint256 tokenId, bytes calldata) external returns (bytes4) {
        require(operator == SEWER_PASS_CLAIM);
        require(currentMinter != address(0));
        IERC721(SEWER_PASS).safeTransferFrom(address(this), currentMinter, tokenId);
        return IERC721Receiver.onERC721Received.selector;
    }
}