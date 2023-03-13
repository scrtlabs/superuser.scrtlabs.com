import useUrlState from "@ahooksjs/use-url-state";
import CircleIcon from "@mui/icons-material/Circle";
import ErrorIcon from "@mui/icons-material/Error";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { Breakpoint, BreakpointProvider } from "react-socks";
import { SecretNetworkClient } from "secretjs";
import { explorerTxFromChainId } from "./explorers";
import "./index.css";
import MsgEditor from "./MsgEditor";
import { balanceFormat, messages as Msgs } from "./Msgs";
import { reconnectWallet, WalletButton } from "./WalletStuff";

ReactDOM.render(
  <BreakpointProvider>
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Typography>
                <App />
              </Typography>
            }
          />
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
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isTxDialogOpen, setIsTxDialogOpen] = useState<boolean>(false);
  const [txDialogError, setTxDialogError] = useState<JSX.Element | null>(null);
  const [txDialogSuccess, setTxDialogSuccess] = useState<any>(null);
  const [nodeStatus, setNodeStatus] = useState<JSX.Element | string>("");
  const [chainStatus, setChainStatus] = useState<JSX.Element | string>("");
  const [apiUrl, setApiUrl] = useState<string>("https://lcd.secret.express");
  const [chainId, setChainId] = useState<string>("secret-4");
  const [prefix, setPrefix] = useState<string>("secret");
  const [denom, setDenom] = useState<string>("uscrt");

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
    // superusers don't click around
    reconnectWallet(setSecretjs, setWalletAddress, apiUrl, chainId).catch(
      (error) => {}
    );
  }, []);

  const refreshNodeStatus = async (
    querySecretjs: SecretNetworkClient,
    showLoading: boolean
  ) => {
    try {
      if (showLoading) {
        setNodeStatus(
          <CircleIcon color={"disabled"} sx={{ fontSize: "small" }} />
        );
        setChainStatus(
          <div style={{ display: "flex", placeItems: "center", gap: "0.5rem" }}>
            <CircularProgress size={"1em"} />
            <span>Loading...</span>
          </div>
        );
      }

      const { block } = await querySecretjs.query.tendermint.getLatestBlock({});
      let minimum_gas_price: string | undefined;
      try {
        ({ minimum_gas_price } = await querySecretjs.query.node.config({}));
      } catch (error) {
        // Bug on must chains - this endpoint isn't connected
      }
      const { params } = await querySecretjs.query.staking.params({});

      setDenom(params!.bond_denom!);

      const chainId = block?.header?.chain_id!;
      const blockHeight = balanceFormat(Number(block?.header?.height));

      let gasPrice: string | undefined;
      if (minimum_gas_price) {
        gasPrice = minimum_gas_price.replace(/0*([a-z]+)$/, "$1");
      }

      const blockTimeAgo = Math.floor(
        (Date.now() - Date.parse(block?.header?.time as string)) / 1000
      );
      let blockTimeAgoString = `${blockTimeAgo}s ago`;
      if (blockTimeAgo <= 0) {
        blockTimeAgoString = "now";
      }

      setChainId(chainId);

      if (secretjs) {
        reconnectWallet(setSecretjs, setWalletAddress, apiUrl, chainId);
      }

      setNodeStatus(
        <CircleIcon color={"success"} sx={{ fontSize: "small" }} />
      );
      setChainStatus(
        <div style={{ display: "flex", placeItems: "center", gap: "1rem" }}>
          <span
            style={{
              display: "flex",
              placeItems: "center",
              gap: "0.3rem",
            }}
          >
            <img src="/scrt.svg" style={{ width: "1.5em", borderRadius: 10 }} />
            <span>
              <Breakpoint large up>
                <strong>Chain:</strong> {chainId}
              </Breakpoint>
              <Breakpoint medium down>
                {chainId}
              </Breakpoint>
            </span>
          </span>
          <Tooltip title={blockTimeAgoString} placement="top">
            <span
              style={{
                display: "flex",
                placeItems: "center",
                gap: "0.3rem",
              }}
            >
              <ViewInArIcon />
              <>
                <Breakpoint large up>
                  <strong>Block:</strong> {blockHeight}
                </Breakpoint>
                <Breakpoint medium down>
                  {blockHeight}
                </Breakpoint>
              </>
            </span>
          </Tooltip>
          {gasPrice && (
            <span
              style={{
                display: "flex",
                placeItems: "center",
                gap: "0.3rem",
              }}
            >
              <LocalGasStationIcon />
              <span>
                <Breakpoint large up>
                  <strong>Gas price:</strong> {gasPrice}
                </Breakpoint>
                <Breakpoint medium down>
                  {gasPrice}
                </Breakpoint>
              </span>
            </span>
          )}
        </div>
      );
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = JSON.stringify(error);
      }

      setNodeStatus(<CircleIcon color={"error"} sx={{ fontSize: "small" }} />);
      setChainStatus(
        <div style={{ display: "flex", placeItems: "center", gap: "0.5rem" }}>
          <ErrorIcon />
          <span>Error: {errorMessage}</span>
        </div>
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setApiUrl((apiUrl) => {
        const secretjs = new SecretNetworkClient({
          url: apiUrl,
          chainId: "",
        });

        refreshNodeStatus(secretjs, false);

        return apiUrl;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const secretjs = new SecretNetworkClient({
      url: apiUrl,
      chainId: "",
    });

    refreshNodeStatus(secretjs, true);
  }, [apiUrl]);

  useEffect(() => {
    if (!secretjs) {
      return;
    }

    setPrefix(secretjs.address.replace(/^([a-z]+)1.*$/, "$1"));

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
              JSON.parse(state[msgIndex][1]),
              prefix,
              denom
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
        <WalletButton
          secretjs={secretjs}
          setSecretjs={setSecretjs}
          walletAddress={walletAddress}
          setWalletAddress={setWalletAddress}
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
          Super User
        </Typography>
        <Typography
          component="div"
          align="center"
          sx={{ marginBottom: "1rem" }}
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
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "95%",
                paddingLeft: "2rem",
                gap: "0.5rem",
                placeItems: "center",
              }}
            >
              <Breakpoint small down>
                <TextField
                  label="API"
                  variant="outlined"
                  value={apiUrl}
                  sx={{ width: "80vw" }}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </Breakpoint>
              <Breakpoint medium up>
                <TextField
                  label="API"
                  variant="outlined"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </Breakpoint>
              {nodeStatus}
              <Breakpoint medium up>
                {chainStatus}
              </Breakpoint>
            </div>
            <Breakpoint small down>
              {chainStatus}
            </Breakpoint>
            <div style={{ width: "95%" }}>
              {Object.keys(state).map((msgIndex) => {
                return (
                  <span key={`${msgIndex}`}>
                    <Divider>
                      <Chip variant="outlined" label={`Message #${msgIndex}`} />
                    </Divider>
                    <MsgEditor
                      secretjs={secretjs!}
                      msgType={state[msgIndex][0]}
                      msgInput={state[msgIndex][1]}
                      denom={denom}
                      prefix={prefix}
                      setMsgInput={(input: string) => {
                        setState((state) => ({
                          [msgIndex]: [
                            state[msgIndex][0],
                            input !== ""
                              ? input
                              : JSON.stringify(
                                  Msgs[state[msgIndex][0]]?.example(
                                    secretjs,
                                    null,
                                    prefix,
                                    denom
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
                                  Msgs[type]?.example(
                                    secretjs,
                                    null,
                                    prefix,
                                    denom
                                  ),
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
                disabled={walletAddress === "" || !secretjs}
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
                        return Msgs[type].converter(
                          JSON.parse(input),
                          prefix,
                          denom
                        );
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
                              href={`${explorerTxFromChainId[chainId]}/${tx.transactionHash}`}
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
                          href={`${explorerTxFromChainId[chainId]}/${txDialogSuccess}`}
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
