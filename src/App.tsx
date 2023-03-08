import useUrlState from "@ahooksjs/use-url-state";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { BreakpointProvider } from "react-socks";
import { SecretNetworkClient } from "secretjs";
import "./index.css";
import { balanceFormat, messages as Msgs } from "./Msgs";
import MsgEditor from "./MsgEditor";
import { setupKeplr, WalletPanel } from "./WalletStuff";

ReactDOM.render(
  <BreakpointProvider>
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </BreakpointProvider>,
  document.getElementById("root")
);

type State = {
  [msgIndex: string]: [/* type: */ string, /* input: */ string] | undefined;
};

export default function App() {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [secretAddress, setSecretAddress] = useState<string>("");
  const [isTxDialogOpen, setIsTxDialogOpen] = useState<boolean>(false);
  const [txDialogError, setTxDialogError] = useState<JSX.Element | null>(null);
  const [txDialogSuccess, setTxDialogSuccess] = useState<any>(null);
  const [nodeStatus, setNodeStatus] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("https://lcd.secret.express");
  const [chainId, setChainId] = useState<string>("secret-4");

  const [state, setState] = useUrlState<State>(
    {
      "0": ["", ""],
    },
    {
      parseOptions: {
        arrayFormat: "index",
      },
      stringifyOptions: {
        arrayFormat: "index",
      },
    }
  );

  useEffect(() => {
    const secretjs = new SecretNetworkClient({
      url: apiUrl,
      chainId: "",
    });

    (async () => {
      try {
        setNodeStatus("Loading...");

        const { block } = await secretjs.query.tendermint.getLatestBlock({});
        const { minimum_gas_price } = await secretjs.query.node.config({});

        const chainId = block?.header?.chain_id!;
        setChainId(chainId);

        if (secretjs) {
          setupKeplr(setSecretjs, setSecretAddress, apiUrl, chainId);
        }

        setNodeStatus(
          `Chain: ${chainId}, Block: ${balanceFormat(
            Number(block?.header?.height)
          )} (${Math.floor(
            (Date.now() - Date.parse(block?.header?.time as string)) / 1000
          )}s ago), Gas Price: ${minimum_gas_price!.replace(
            /0*uscrt/,
            "uscrt"
          )}`
        );
      } catch (error) {
        //@ts-expect-error
        setNodeStatus(`Error: ${error.message}`);
      }
    })();
  }, [apiUrl]);

  useEffect(() => {
    if (!secretjs) {
      return;
    }

    Object.keys(state).forEach((msgIndex) => {
      if (!Msgs[state[msgIndex][0]]?.example) {
        return;
      }

      setState((state) => ({
        [msgIndex]: [
          state[msgIndex][0],
          JSON.stringify(
            Msgs[state[msgIndex][0]].example(
              secretjs,
              JSON.parse(state[msgIndex][1])
            ),
            null,
            2
          ),
        ],
      }));
    });
  }, [secretjs]);

  return (
    <div style={{ padding: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          minHeight: "3rem",
          gap: "0.5rem",
        }}
      >
        <WalletPanel
          secretjs={secretjs}
          setSecretjs={setSecretjs}
          secretAddress={secretAddress}
          setSecretAddress={setSecretAddress}
          url={apiUrl}
          chainId={chainId}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          placeItems: "center",
          placeContent: "center",
          gap: "0.3rem",
        }}
      >
        <Typography
          variant="h3"
          component="div"
          align="center"
          sx={{ marginTop: "0.5rem" }}
        >
          Tx Builder
        </Typography>
        <Typography
          component="div"
          align="center"
          sx={{
            marginBottom: "0.5rem",
          }}
        >
          send complex transactions.
        </Typography>
      </div>
      {secretjs && (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              placeItems: "center",
              placeContent: "center",
              gap: "0.3rem",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "95%",
                paddingLeft: "2rem",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <TextField
                label="API"
                variant="outlined"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <CircleIcon
                color={
                  nodeStatus.startsWith("Error")
                    ? "error"
                    : nodeStatus.startsWith("Loading")
                    ? "disabled"
                    : "success"
                }
                sx={{ fontSize: "small" }}
              />
              <Typography>{nodeStatus}</Typography>
            </div>
            <div style={{ width: "95%" /* , maxWidth: "45rem" */ }}>
              {Object.keys(state).map((msgIndex) => {
                return (
                  <span key={`${msgIndex}`}>
                    <Divider>
                      <Chip variant="outlined" label={`#${msgIndex}`} />
                    </Divider>
                    <MsgEditor
                      secretjs={secretjs!}
                      msgType={state[msgIndex][0]}
                      msgInput={state[msgIndex][1]}
                      setMsgInput={(input: string) => {
                        setState((state) => ({
                          [msgIndex]: [
                            state[msgIndex][0],
                            input !== ""
                              ? input
                              : JSON.stringify(
                                  Msgs[state[msgIndex][0]]?.example(
                                    secretjs,
                                    null
                                  ),
                                  null,
                                  2
                                ) || "",
                          ],
                        }));
                      }}
                      setMsgType={(type: string) => {
                        setState((state) => ({
                          [msgIndex]: [
                            type,
                            type !== state[msgIndex][0]
                              ? JSON.stringify(
                                  Msgs[type]?.example(secretjs, null),
                                  null,
                                  2
                                ) || ""
                              : state[msgIndex][1],
                          ],
                        }));
                      }}
                      invokeDelete={() => {
                        setState((state) => {
                          const newState: State = {};
                          Object.keys(state).forEach((i) => {
                            if (Number(i) < Number(msgIndex)) {
                              newState[i] = state[i];
                            }
                            if (Number(i) > Number(msgIndex)) {
                              newState[String(Number(i) - 1)] = state[i];
                            }
                          });
                          newState[Object.keys(state).length - 1] = undefined;
                          return newState;
                        });
                      }}
                    ></MsgEditor>
                  </span>
                );
              })}
              <Divider>
                <Chip
                  variant="outlined"
                  color="primary"
                  label="+"
                  onClick={() => {
                    setState((state) => ({
                      [String(Object.keys(state).length)]: ["", ""],
                    }));
                  }}
                />
              </Divider>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <Button
                disabled={secretAddress === "" || !secretjs}
                variant="contained"
                sx={{
                  padding: "0.5em 0",
                  width: "10em",
                  fontWeight: "bold",
                  fontSize: "1.2em",
                }}
                onClick={async () => {
                  setIsTxDialogOpen(true);
                  setTxDialogSuccess(null);
                  setTxDialogError(null);

                  try {
                    const tx = await secretjs.tx.broadcast(
                      Object.values(state).map(([type, input]) => {
                        return Msgs[type].converter(JSON.parse(input));
                      }),
                      {
                        gasLimit: 150_000,
                      }
                    );
                    if (tx.code === 0) {
                      setTxDialogSuccess(tx.transactionHash);
                    } else {
                      setTxDialogError(
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span>{tx.rawLog}</span>
                          <span
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <a
                              href={`https://www.mintscan.io/secret/txs/${tx.transactionHash}`}
                              target="_blank"
                              style={{ textDecoration: "none" }}
                            >
                              Open explorer
                            </a>
                          </span>
                        </span>
                      );
                    }
                  } catch (e) {
                    // @ts-ignore
                    setTxDialogError(e.message);
                  }
                }}
              >
                Send Tx
              </Button>
              <Dialog open={isTxDialogOpen}>
                <DialogTitle>
                  {txDialogSuccess
                    ? "Success"
                    : txDialogError
                    ? "Error"
                    : "Sending Transaction..."}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText sx={{ minWidth: "20rem" }}>
                    {txDialogError ? (
                      txDialogError
                    ) : txDialogSuccess ? (
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <a
                          href={`https://www.mintscan.io/secret/txs/${txDialogSuccess}`}
                          target="_blank"
                          style={{ textDecoration: "none" }}
                        >
                          Open explorer
                        </a>
                      </span>
                    ) : null}
                  </DialogContentText>
                </DialogContent>
                {txDialogSuccess || txDialogError ? (
                  <DialogActions>
                    <Button
                      onClick={() => {
                        setIsTxDialogOpen(false);
                        setTxDialogError(null);
                        setTxDialogSuccess(null);
                      }}
                      autoFocus
                    >
                      {txDialogSuccess ? "Cool" : "Bummer"}
                    </Button>
                  </DialogActions>
                ) : null}
              </Dialog>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
