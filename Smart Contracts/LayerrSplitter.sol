// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract LayerrSplitter is PaymentSplitter {

    address constant public LAYERRXYZ = 0x936Dd8afE0ca93BE3fadbb4B1c4BF1735e8b57da;
    address constant public PAT = 0xE9bC3058A30E14C2Ba6a4fD6B49684237A67aF56;
    address constant public KEN = 0x37074614C6343609D405dB6516606d8A8F95AFD9;
    address constant public JUSTADEV = 0x3e6a203ab73C4B35Be1F65461D88Fb21DE26446e;
    address constant public JOSHONG = 0xaf469C4a0914938e6149CF621c54FB4b1EC0c202;

    address[] private RECIPIENTS = [LAYERRXYZ, PAT, KEN, JOSHONG, JUSTADEV];
    uint256[] private SHARES = [225, 225, 225, 100, 225];

    constructor() PaymentSplitter(RECIPIENTS, SHARES) { }
}