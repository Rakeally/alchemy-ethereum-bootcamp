// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DAOProxy {
    bytes32 constant DAO_IMPLEMENTATION_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 constant ADMIN_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

    constructor(address daoImplementation) {
        upgradeTo(daoImplementation);
        upgradeAdmin(msg.sender);
    }

    modifier onlyAdmin() {
        require(getAdmin() == msg.sender, "Only the Admin can make this call");
        _;
    }

    function upgradeImplementationTo(address newImpl) external onlyAdmin {
        upgradeTo(newImpl);
    }

    function upgradeAdminTo(address newAdmin) external onlyAdmin {
        upgradeAdmin(newAdmin);
    }

    function upgradeAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }

    function upgradeTo(address newImpl) internal {
        bytes32 slot = DAO_IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImpl)
        }
    }

    function getDaoImplementation() public view returns (address impl) {
        bytes32 slot = DAO_IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    function getAdmin() public view returns (address admin) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            admin := sload(slot)
        }
    }

    fallback() external {
        address implementationAddress = getDaoImplementation();
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, returndatasize(), calldatasize())
            let result := delegatecall(
                gas(),
                implementationAddress,
                ptr,
                calldatasize(),
                returndatasize(),
                returndatasize()
            )
            returndatacopy(ptr, 0, returndatasize())

            switch result
            case 0 {
                revert(ptr, returndatasize())
            }
            default {
                return(ptr, returndatasize())
            }
        }
    }
}
