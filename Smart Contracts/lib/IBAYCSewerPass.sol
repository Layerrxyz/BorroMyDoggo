// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IBAYCSewerPass {
    function getMintDataByTokenId(uint256 tokenId) external view returns (uint256 tier, uint256 apeTokenId, uint256 dogTokenId);
}