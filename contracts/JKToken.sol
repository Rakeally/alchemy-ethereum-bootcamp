// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JKToken is ERC20 {
    constructor(uint initialSupply) ERC20("janeToken", "JKT") {
        _mint(msg.sender, initialSupply * 10 ** uint(decimals()));
    }

    function transferToken(
        address _sender,
        address _recipient,
        uint _amount
    ) public returns (bool) {
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    function mintJKT(address _addr, uint _amount) public {
        _mint(_addr, _amount);
    }
}
