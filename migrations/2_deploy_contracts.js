const AuV = artifacts.require("AuVImplementation");
const Proxy = artifacts.require("AdminUpgradeabilityProxy");

module.exports = async function (deployer) {
  await deployer;

  await deployer.deploy(AuV);
  const proxy = await deployer.deploy(Proxy, AuV.address);
  const proxiedAuV = await AuV.at(proxy.address);
  await proxy.changeAdmin("0xC56DcFA9380571114C5d69B269c185964decF7a0");
  await proxiedAuV.initialize();
};
