import DeleteIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { SecretNetworkClient } from "secretjs";
import { messages, SupportedMessage } from "./Msgs";

export default function MsgEditor({
  secretjs,
  invokeDelete,
  msgType,
  msgInput,
  setMsgType,
  setMsgInput,
}: {
  secretjs: SecretNetworkClient;
  msgType: string;
  msgInput: string;
  setMsgType: (type: string) => void;
  setMsgInput: (input: string) => void;
  invokeDelete: () => void;
}) {
  const [relevantInfo, setRelevantInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState<boolean>(false);
  const [isLoadingError, setIsLoadingError] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (messages[msgType]?.relevantInfo) {
        setIsLoadingInfo(true);
        setRelevantInfo(await messages[msgType].relevantInfo!(secretjs));
        setIsLoadingInfo(false);
      } else {
        setRelevantInfo(null);
      }
    })();
  }, [msgType]);

  useEffect(() => {
    setIsError(false);
    setErrorText("");
  }, [msgType, msgInput]);

  const checkError = async () => {
    setIsLoadingError(true);

    const result = await checkMsg(msgType, msgInput, secretjs);

    setErrorText(result);
    if (result === "") {
      setIsError(false);
    } else {
      setIsError(true);
    }
    setIsLoadingError(false);
  };

  useEffect(() => {
    checkError();
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          placeContent: "flex-start",
          placeItems: "center",
          justifyContent: "space-between",
          padding: "1rem",
          gap: "1rem",
        }}
      >
        <Autocomplete
          disablePortal
          options={Object.keys(messages).sort((a, b) => {
            const module = messages[a].module.localeCompare(messages[b].module);
            if (module !== 0) {
              return module;
            } else {
              return a.localeCompare(b);
            }
          })}
          sx={{ width: "21rem" }}
          renderInput={(params) => (
            <TextField {...params} label="Message Type" />
          )}
          value={msgType}
          onChange={(_, newMsgType) => setMsgType(newMsgType || "")}
        />
        <IconButton onClick={invokeDelete}>
          <DeleteIcon />
        </IconButton>
      </div>
      <div
        style={{
          display: "flex",
          placeItems: "center",
          padding: "1rem",
          gap: "1rem",
        }}
      >
        <TextField
          sx={{ width: "100%" }}
          label="Message Content"
          multiline
          minRows={5}
          maxRows={500}
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          error={isError}
          helperText={
            isLoadingError ? (
              <span
                style={{
                  display: "flex",
                  gap: "0.5em",
                  placeItems: "center",
                }}
              >
                <CircularProgress size="1em" />
                <Typography sx={{ fontSize: "1em" }}>Simulating...</Typography>
              </span>
            ) : (
              errorText
            )
          }
          onBlur={() => {
            try {
              setMsgInput(JSON.stringify(JSON.parse(msgInput), null, 2));
            } catch (error) {}
            checkError();
          }}
        />
      </div>
      {isLoadingInfo && (
        <div
          style={{
            display: "flex",
            placeItems: "center",
            padding: "1rem",
            gap: "1rem",
          }}
        >
          <CircularProgress size="1rem" />
        </div>
      )}
      {relevantInfo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem 1rem 1rem 1.2rem",
            gap: "1rem",
          }}
        >
          <Typography component="div" align="left" sx={{ fontSize: "small" }}>
            <details>
              <summary style={{ cursor: "pointer" }}> Relevant info</summary>
              {relevantInfo}
            </details>
          </Typography>
        </div>
      )}
    </>
  );
}

async function checkMsg(
  type: string,
  input: string,
  secretjs: SecretNetworkClient
): Promise<string> {
  if (!messages[type]) {
    return "";
  }

  let msg: SupportedMessage;
  try {
    msg = messages[type].converter(JSON.parse(input));
  } catch (error) {
    //@ts-ignore
    return error.message;
  }

  try {
    const sim = await secretjs.tx.simulate([msg], { gasLimit: 0 });
    return "";
  } catch (error) {
    //@ts-ignore
    const rawLog = error.message;

    if (rawLog.includes("Enclave: failed to validate transaction")) {
      // enclave won't work in simulation mode
      // this check will only flag app-level errors (so in x/compute only errors from out of the enclave)
      return "";
    } else if (rawLog.includes("failed to execute message")) {
      return rawLog;
    } else {
      return "";
    }
  }
}
