import { FileCopyOutlined } from "@mui/icons-material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Else, If, Then } from "react-if";
import { Breakpoint } from "react-socks";
import { SecretNetworkClient } from "secretjs";
import { Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
  interface Window extends KeplrWindow {}
}
window.addEventListener("keplr_keystorechange", () => {
  console.log("Key store in Keplr is changed. Refreshing page.");
  location.reload();
});

export function WalletPanel({
  secretjs,
  setSecretjs,
  secretAddress,
  setSecretAddress,
}: {
  secretjs: SecretNetworkClient | null;
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>;
  secretAddress: string;
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const content = (
    <div style={{ display: "flex", placeItems: "center", borderRadius: 10 }}>
      <Breakpoint small down style={{ display: "flex" }}>
        <img src="/fina.webp" style={{ width: "1.8rem", borderRadius: 10 }} />
      </Breakpoint>
      <Breakpoint medium up style={{ display: "flex" }}>
        <img src="/keplr.svg" style={{ width: "1.8rem", borderRadius: 10 }} />
      </Breakpoint>
      <span style={{ margin: "0 0.3rem" }}>
        <If condition={secretAddress.length > 0}>
          <Then>
            <Breakpoint small down>{`${secretAddress.slice(
              0,
              6
            )}...${secretAddress.slice(-4)}`}</Breakpoint>
            <Breakpoint medium up>
              {secretAddress}
            </Breakpoint>
          </Then>
          <Else>
            <Breakpoint small down>
              Connect
            </Breakpoint>
            <Breakpoint medium up>
              Connect wallet
            </Breakpoint>
          </Else>
        </If>
      </span>
    </div>
  );

  if (secretjs) {
    return (
      <CopyToClipboard
        text={secretAddress}
        onCopy={() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        }}
      >
        <Button
          variant="contained"
          style={{
            background: "white",
            textTransform: "none",
            color: "black",
          }}
        >
          {content}{" "}
          <FileCopyOutlined
            fontSize="small"
            style={isCopied ? { fill: "green" } : undefined}
          />
        </Button>
      </CopyToClipboard>
    );
  } else {
    try {
      // superusers don't click around
      setupKeplr(setSecretjs, setSecretAddress);
    } catch (error) {}
    return (
      <Button
        id="keplr-button"
        variant="contained"
        style={{ background: "white", color: "black" }}
        onClick={() => setupKeplr(setSecretjs, setSecretAddress)}
      >
        {content}
      </Button>
    );
  }
}

async function setupKeplr(
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>,
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (
    !window.keplr ||
    !window.getEnigmaUtils ||
    !window.getOfflineSignerOnlyAmino
  ) {
    await sleep(50);
  }

  const SECRET_CHAIN_ID = "secret-4";

  await window.keplr.enable(SECRET_CHAIN_ID);

  const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(SECRET_CHAIN_ID);
  const accounts = await keplrOfflineSigner.getAccounts();

  const secretAddress = accounts[0].address;

  const secretjs = new SecretNetworkClient({
    url: "https://lcd.secret.express",
    chainId: SECRET_CHAIN_ID,
    wallet: keplrOfflineSigner,
    walletAddress: secretAddress,
    encryptionUtils: window.getEnigmaUtils(SECRET_CHAIN_ID),
  });

  setSecretAddress(secretAddress);
  setSecretjs(secretjs);
}