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

    address constant public BAYC = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D;
    address constant public MAYC = 0x60E4d786628Fea6478F785A6d7e704777c86a7c6;
    address constant public BAKC = 0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623;

    address constant public LAYERRXYZ = 0x936Dd8afE0ca93BE3fadbb4B1c4BF1735e8b57da;
    address constant public PAT = 0xE9bC3058A30E14C2Ba6a4fD6B49684237A67aF56;
    address constant public JUSTADEV = 0x3e6a203ab73C4B35Be1F65461D88Fb21DE26446e;
    uint64 constant public FEE = 50;

    IDelegationRegistry delegateCash = IDelegationRegistry(0x00000000000076A84feF008CDAbe6409d2FE638B);

    address constant public SEWER_PASS = 0x764AeebcF425d56800eF2c84F2578689415a2DAa;
    address constant public SEWER_PASS_CLAIM = 0xBA5a9E9CBCE12c70224446C24C111132BECf9F1d;

    uint256 public layerrEarnings = 0;

    mapping(uint256 => uint256) public rentACost;
    address private currentMinter;
    BitMaps.BitMap private dawgLoaned;

    /** rentADawgs allows bayc/mayc holder to mint tier 4/tier 2 sewer pass
        apes must be delegated to this contract address by ape owner using delegate.cash
        using dawg delegated and loaned by a dawg holder
        payment must be greater than or equal to sum of all dawgs used and can be calculated with calculateRentACost
        sewer passes will be minted and transfered to the account that calls this function
        minter must be direct owner or delegate for the BAYC/MAYC tokens supplied
        BAYC or MAYC can be supplied as empty arrays but total apes must equal total dawgs
        90% of rentA fees go to dawg owner, 5% to 0xfoobar for delegate.cash and 5% to 0xth0mas
    */
    function rentADawgs(uint256[] calldata baycIds, uint256[] calldata maycIds, uint256[] calldata dawgIds) external payable nonReentrant {
        require((baycIds.length + maycIds.length) == dawgIds.length, "APE/DAWG COUNT MISMATCH");
        uint256 totalRentACost = this.calculateRentACost(dawgIds);
        require(msg.value >= totalRentACost, "INSUFFICIENT PAYMENT");
        uint256 dawgIndex = 0;
        currentMinter = msg.sender;
        address apeOwner;
        for(uint256 i = 0;i < baycIds.length;i++) {
            apeOwner = IERC721(BAYC).ownerOf(baycIds[i]);
            require(apeOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, apeOwner, BAYC, baycIds[i]), "NOT APE OWNER OR DELEGATE");
            IBAYCSewerPassClaim(SEWER_PASS_CLAIM).claimBaycBakc(baycIds[i], dawgIds[dawgIndex]);
            payDawgOwner(dawgIds[dawgIndex]);
            dawgIndex++;
        }
        for(uint256 i = 0;i < maycIds.length;i++) {
            apeOwner = IERC721(MAYC).ownerOf(maycIds[i]);
            require(apeOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, apeOwner, MAYC, maycIds[i]), "NOT APE OWNER OR DELEGATE");
            IBAYCSewerPassClaim(SEWER_PASS_CLAIM).claimMaycBakc(maycIds[i], dawgIds[dawgIndex]);
            payDawgOwner(dawgIds[dawgIndex]);
            dawgIndex++;
        }
        currentMinter = address(0);
    }

    /** calculate and send payment for use of dawg in minting sewer pass, cleans up state
    */
    function payDawgOwner(uint256 dawgId) internal {
        address dawgOwner = IERC721(BAKC).ownerOf(dawgId);
        uint256 payment = rentACost[dawgId] * FEE / 100;
        (bool sent, ) = payable(dawgOwner).call{value: payment}("");
        require(sent);
        rentACost[dawgId] = 0;
        dawgLoaned.unset(this.getDawgLoanIndex(dawgOwner, dawgId));
    }


    /** takes dawg off loan, you can also revoke delegation to this contract with delegate.cash for same effect
    */
    function unloanDawgs(uint256[] calldata dawgIds) external {
        address dawgOwner;
        for(uint256 dawgIndex = 0;dawgIndex < dawgIds.length;dawgIndex++) {
            dawgOwner = IERC721(BAKC).ownerOf(dawgIds[dawgIndex]);
            require(dawgOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, dawgOwner, BAKC, dawgIds[dawgIndex]), "NOT DAWG OWNER OR DELEGATE");
            dawgLoaned.unset(this.getDawgLoanIndex(dawgOwner, dawgIds[dawgIndex]));
            rentACost[dawgIds[dawgIndex]] = 0;
        }
    }


    /** loan dawgs for bayc/mayc to mint higher tier sewer passes
        dawgs must be delegated to this contract address by dawg owner using delegate.cash
        dawgIds = array of dawgs to loan out, must be direct owner or delegate to call
        costToRentA = payment to be received when your dawg is used to mint a sewer pass, cost is in WEI
        payment will be sent to dawg owner wallet
        can be called again to adjust costToRentA
    */
    function loanDawgs(uint256[] calldata dawgIds, uint256 costToRentA) external {
        address dawgOwner;
        for(uint256 dawgIndex = 0;dawgIndex < dawgIds.length;dawgIndex++) {
            dawgOwner = IERC721(BAKC).ownerOf(dawgIds[dawgIndex]);
            require(dawgOwner == msg.sender ||
                delegateCash.checkDelegateForToken(msg.sender, dawgOwner, BAKC, dawgIds[dawgIndex]), "NOT DAWG OWNER OR DELEGATE");
            dawgLoaned.set(this.getDawgLoanIndex(dawgOwner, dawgIds[dawgIndex]));
            rentACost[dawgIds[dawgIndex]] = costToRentA;
        }
    }

    struct DawgLoaned {
        uint64 dawgId;
        uint64 rentACost;
    }

    /** utility function to return list of available dawgs for sewer pass minting and cost to rentA for each dawg
        find cheapest dawg ids to rentAw and supply array to calculateRentACost for total cost
    */
    function availableDawgs() external view returns(DawgLoaned[] memory) {
        uint256 dawgsAvailable = 0;
        address dawgOwner;
        for(uint256 dawgIndex = 0;dawgIndex < 10000;dawgIndex++) {
            try IERC721(BAKC).ownerOf(dawgIndex) returns (address result) { dawgOwner = result; } catch { dawgOwner = address(0); }
            if(dawgLoaned.get(this.getDawgLoanIndex(dawgOwner, dawgIndex)) && 
              delegateCash.checkDelegateForToken(address(this), dawgOwner, BAKC, dawgIndex) &&
              !IBAYCSewerPassClaim(SEWER_PASS_CLAIM).bakcClaimed(dawgIndex)) {
                dawgsAvailable++;
            }
        }

        DawgLoaned[] memory loans = new DawgLoaned[](dawgsAvailable);
        uint256 currentIndex = 0;
        for(uint256 dawgIndex = 0;dawgIndex < 10000;dawgIndex++) {
            try IERC721(BAKC).ownerOf(dawgIndex) returns (address result) { dawgOwner = result; } catch { dawgOwner = address(0); }
            if(dawgLoaned.get(this.getDawgLoanIndex(dawgOwner, dawgIndex)) && 
              delegateCash.checkDelegateForToken(address(this), dawgOwner, BAKC, dawgIndex) &&
              !IBAYCSewerPassClaim(SEWER_PASS_CLAIM).bakcClaimed(dawgIndex)) {
                  DawgLoaned memory dl;
                  dl.dawgId = uint64(dawgIndex);
                  dl.rentACost = uint64(rentACost[dawgIndex]);
                loans[currentIndex] = dl;
                currentIndex++;
                if(currentIndex >= dawgsAvailable) { break; }
            }
        }
        return loans;
    }

    /** offset dawgId by owner address for loan mapping,
        ensures that dawg transfer and subsequent delegation
        by new owner does not enable a boost sale at previous
        listing
    */
    function getDawgLoanIndex(address dawgOwner, uint256 dawgId) external pure returns(uint256 dawgLoanIndex) {
        dawgLoanIndex = uint256(uint160(dawgOwner)) + dawgId;
    }

    /** calculates total cost of dawg rentAwing
    */
    function calculateRentACost(uint256[] calldata dawgIds) external view returns(uint256 totalRentACost) {
        address dawgOwner;
        for(uint256 i = 0;i < dawgIds.length;i++) {
            try IERC721(BAKC).ownerOf(dawgIds[i]) returns (address result) { dawgOwner = result; } catch { dawgOwner = address(0); }
            require(dawgLoaned.get(this.getDawgLoanIndex(dawgOwner, dawgIds[i])), "DAWG NOT LOANED");
            totalRentACost += rentACost[dawgIds[i]];
        }
    }

    function withdraw() external {
        uint256 balance = address(this).balance;
        if (layerrEarnings < 5 ether) {
            if (balance + layerrEarnings < 5 ether) {
                payable(LAYERRXYZ).transfer(balance);
                layerrEarnings += balance;
            } else {
                uint256 remainingOwed = 5 ether - layerrEarnings;
                payable(LAYERRXYZ).transfer(remainingOwed);
                layerrEarnings += remainingOwed;
                balance -= remainingOwed;
                uint256 justadev = balance * 3 / 100;
                uint256 layerrxyz = balance * 25 / 100;
                uint256 pat = balance - justadev - layerrxyz;
                payable(JUSTADEV).transfer(justadev);
                payable(LAYERRXYZ).transfer(layerrxyz);
                payable(PAT).transfer(pat);
            }
        } else {
            uint256 justadev = balance * 3 / 100;
            uint256 layerrxyz = balance * 25 / 100;
            uint256 pat = balance - justadev - layerrxyz;
            payable(JUSTADEV).transfer(justadev);
            payable(LAYERRXYZ).transfer(layerrxyz);
            payable(PAT).transfer(pat);
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