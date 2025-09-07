const { ethers } = require("hardhat");

async function main() {
    // Địa chỉ Proxy Contract (lấy từ lần deploy trước)
    const proxyAddress = "0x0b8479812A68ee9fa30a7CEE0D2BeF0C9b329bA7"; // Thay bằng địa chỉ Proxy thực tế

    const deployerAddress = "0x335145400C12958600C0542F9180e03B917F7BbB"; // Địa chỉ deployer
    const otherAddress = "0x335145400C12958600C0542F9180e03B917F7BbB"; // Một địa chỉ khác để test

    // Kết nối với Proxy Contract
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", proxyAddress);

    // Test isAdmin với deployer.address
    const isDeployerAdmin = await fundVault.isAdmin(deployerAddress);
    console.log(`Is ${deployerAddress} admin? ${isDeployerAdmin}`);

    // Test isAdmin với địa chỉ khác
    const isOtherAdmin = await fundVault.isAdmin(otherAddress);
    console.log(`Is ${otherAddress} admin? ${isOtherAdmin}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// const { expect } = require("chai");
// const { ethers, upgrades } = require("hardhat");

// describe("MoneyFiFundVault Deployment", function () {
//     let deployer, user;
//     let moneyFiFundVault;
//     let controllerAddress, feeToAddress;

//     beforeEach(async function () {
//         // Lấy danh sách tài khoản
//         [deployer, user] = await ethers.getSigners();

//         // Giả lập địa chỉ cho controller và feeTo (có thể thay bằng hợp đồng thật nếu đã deploy)
//         controllerAddress = deployer.address; // Thay bằng địa chỉ MoneyFiController thực tế nếu có
//         feeToAddress = deployer.address;

//         // Lấy contract factory
//         const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");

//         // Deploy proxy
//         moneyFiFundVault = await upgrades.deployProxy(
//             MoneyFiFundVault,
//             [deployer.address, controllerAddress, feeToAddress],
//             { initializer: "initialize" }
//         );

//         // Chờ proxy được triển khai
//         await moneyFiFundVault.waitForDeployment();
//     });

//     it("Should deploy proxy successfully", async function () {
//         // Kiểm tra địa chỉ hợp đồng
//         const fundVaultAddress = await moneyFiFundVault.getAddress();
//         expect(fundVaultAddress).to.be.properAddress;
//     });

//     it("Should initialize with correct admin", async function () {
//         // Kiểm tra vai trò admin
//         const isAdmin = await moneyFiFundVault.isAdmin(deployer.address);
//         expect(isAdmin).to.be.true;

//         // Kiểm tra user không phải admin
//         const isUserAdmin = await moneyFiFundVault.isAdmin(user.address);
//         expect(isUserAdmin).to.be.false;
//     });

//     it("Should initialize with correct controller address", async function () {
//         // Kiểm tra địa chỉ controller
//         const controller = await moneyFiFundVault.controller();
//         expect(controller).to.equal(controllerAddress);
//     });

//     it("Should initialize with correct feeTo address", async function () {
//         // Kiểm tra địa chỉ feeTo
//         const feeTo = await moneyFiFundVault.feeTo();
//         expect(feeTo).to.equal(feeToAddress);
//     });

//     it("Should be paused initially", async function () {
//         // Kiểm tra trạng thái paused (nếu hợp đồng khởi tạo với trạng thái không paused)
//         const isPaused = await moneyFiFundVault.paused();
//         expect(isPaused).to.be.false; // Hợp đồng khởi tạo không paused
//     });

//     it("Should revert if initialized again", async function () {
//         // Thử gọi lại hàm initialize, phải thất bại vì chỉ được gọi một lần
//         await expect(
//             moneyFiFundVault.initialize(deployer.address, controllerAddress, feeToAddress)
//         ).to.be.revertedWith("Initializable: contract is already initialized");
//     });

//     it("Should allow admin to pause the contract", async function () {
//         // Admin gọi hàm pause
//         await moneyFiFundVault.pause();
//         const isPaused = await moneyFiFundVault.paused();
//         expect(isPaused).to.be.true;
//     });

//     it("Should revert if non-admin tries to pause", async function () {
//         // User không phải admin cố gắng gọi pause
//         await expect(
//             moneyFiFundVault.connect(user).pause()
//         ).to.be.revertedWith("InvalidDelegateRole");
//     });
// });
