const { ethers } = require("hardhat");
require("dotenv").config();
// npx hardhat run test/createSignature.js --network sepolia
async function generateReferralSignature() {
    // Lấy tài khoản từ Hardhat
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    // Địa chỉ hợp đồng MoneyFiController từ .env
    const controllerAddress = process.env.MONEYFI_CONTROLLER || "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078";

    // Kết nối với hợp đồng MoneyFiController
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);

    // Tham số cần thiết để tạo chữ ký
    const signerAddress = await controller.signer(); // Địa chỉ signer từ hợp đồng
    const nonce = await controller.nonce(); // Nonce hiện tại từ hợp đồng
    const sender = deployer.address; // Địa chỉ user (sender)
    const isReferral = true; // Đặt true nếu sử dụng referral, false nếu không

    // Kiểm tra thông tin
    console.log(`Signer address: ${signerAddress}`);
    console.log(`Nonce: ${nonce}`);
    console.log(`Sender address: ${sender}`);
    console.log(`Is Referral: ${isReferral}`);

    // Kiểm tra private key của signer
    const signerPrivateKey = process.env.PRIVATE_KEY;
    if (!signerPrivateKey) {
        throw new Error("Missing PRIVATE_KEY in .env. Please provide the private key of the signer.");
    }

    // Tạo thông điệp để ký
    const abiCoder = new ethers.AbiCoder();
    const message = ethers.keccak256(
        abiCoder.encode(
            ["address", "uint256", "address", "bool"],
            [signerAddress, nonce, sender, isReferral]
        )
    );
    const ethSignedMessage = ethers.getBytes(message);

    // Ký thông điệp bằng private key của signer
    const signerWallet = new ethers.Wallet(signerPrivateKey, ethers.provider);
    const signature = await signerWallet.signMessage(ethSignedMessage);

    // In kết quả chữ ký
    console.log(`Generated referral signature: ${signature}`);
    console.log(`Copy this signature and use it in your withdraw script.`);
}

generateReferralSignature()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });