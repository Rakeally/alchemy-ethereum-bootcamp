
# Project SaverNet (Saver Network)

**Final project theme**: Demonstrating Smart Contract Functionality via Custom Unit Tests

**Project Name**: Empowering Africans to Save Collectively in a DAO Project.

**SaverNet** is a project that addresses the challenges of traditional saving systems in Africa by providing a platform for people to come together and collectively save their funds in a decentralized autonomous organization (DAO). This project aims to promote financial inclusion, transparency, and financial autonomy.

### Workflow
**Saving DAO Workflow**

**Step 1: Participant Registration and Role Assignment**
1. Participants join the Saving DAO, and they are assigned roles based on their level of engagement:
   - **Members**: Participants who own tokens and have the right to vote and create proposals.
   - **Admins**: Members with elevated privileges for managing the DAO.
   - **Guests**: Ex members who can observe but cannot participate directly in the DAO.

**Step 2: Saving Funds in the DAO**

2.1. **Token Ownership Requirement**:
    - To become a member with voting rights, individuals must deposit a specific number of their DAO's ERC-20 tokens into the DAO. The number of tokens required for membership may be defined by the DAO's rules.

2.2. **Voting Power Determined by Token Holdings:**
    - Members' voting power is directly proportional to the number of tokens they hold in the DAO. The more tokens a member possesses, the greater their influence in voting on proposals.


**Step 3: Proposal Creation and Voting**
3.1. **Creating Proposals**:
   - Members can create two types of proposals:
     - **Withdrawal Proposals**: These proposals request a specific amount of funds from the DAO for a specified purpose.
     - **Decision Proposals**: These proposals suggest changes or decisions related to the DAO's operations, such as modifying the voting fee or changing the voting duration.

3.2. **Voting on Proposals**:
   - Members vote on available proposals using their tokens. They can either agree or disagree with a proposal, and their voting power is determined by the number of tokens they hold in the DAO.
   - The DAO's voting fee, duration, and threshold may be adjusted as needed to suit the DAO's evolving needs.

**Step 4: Managing Members and Roles**
4.1. **Adding and Removing Members**:
   - Admins can add new members to the DAO by specifying their address and role (Member or Guest).
   - Owner can remove admins from the DAO
   - Admins can also remove members from the DAO to reflect changes in the community.

4.2. **Role Adjustment**:
   - Admins have the authority to change a member's role between Member and Admin, granting or revoking certain privileges accordingly.

**Step 5: Proposal Execution and Fund Allocation**
5.1. **Withdrawal Proposals Approval**:
   - If a withdrawal proposal receives sufficient votes in favor (meeting the voting threshold), and it is approved, the requested funds are released from the DAO's smart contract to the specified address.

5.2. **Decision Proposals Implementation**:
   - Approved decision proposals result in changes to the DAO's parameters or operations as specified in the proposal.

**Step 6: Monitoring and Reporting**
6.1. **Member Role Verification**:
   - Members can verify their role within the DAO in the smart contract.

**Step 7: Ongoing Governance**
7.1. **Regular Updates and Amendments**:
   - The DAO remains adaptable to its community's evolving needs. Admins and members collaborate to make regular updates and amendments to proposals, roles, and operational parameters as required.

**Step 8: Contract Upgrades**

**8.1. Contract Upgradability**:
    - The Saving DAO contract is designed to be upgradeable. This means that the contract code can be modified and improved without the need to create an entirely new contract.

In this Saving DAO workflow, community members are given the power to save and allocate funds, create proposals, and collectively decide on the use of those funds. This decentralized approach to decision-making and fund management ensures transparency and empowers the community to actively participate in the DAO's governance.


### Next Steps
The next steps for SaverNet include:

- Developing a user-friendly frontend to interact with the DAO smart contract.
- Improve contract functionalities

