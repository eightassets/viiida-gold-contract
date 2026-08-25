var HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = "";
const walletChildNum = 0;
const networkAddress = "https://mainnet.infura.io/v3/<your-api-key>";
const ropstenNetworkAddress = "https://ropsten.infura.io/v3/<your-api-key>";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545, // ganache-cli
      network_id: "*", // Match any network id
      gas: 6700000,
      gasPrice: 0x01,
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8321,
      gas: 10000000000000,
      gasPrice: 0x01,
    },
    ropsten: {
      network_id: 3,
      provider: function () {
        return new HDWalletProvider(
          mnemonic,
          ropstenNetworkAddress,
          walletChildNum
        );
      },
      // ropsten block limit
      gas: 8000000,
      gasPrice: 128000000000, // 128 Gwei
    },
    mainnet: {
      network_id: 1,
      provider: function () {
        return new HDWalletProvider(mnemonic, networkAddress, walletChildNum);
      },
      gas: 8000000,
      gasPrice: 128000000000, // 128 Gwei
    },
  },
  compilers: {
    solc: {
      // Use the repository-pinned solc package instead of relying on the
      // remote solc-bin version index. This keeps legacy builds reproducible.
      version: require.resolve("solc/soljson.js"),
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
