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
import { messages } from "./Msgs";

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
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (messages[msgType]?.relevantInfo) {
        setLoadingInfo(true);
        setRelevantInfo(await messages[msgType].relevantInfo!(secretjs));
        setLoadingInfo(false);
      } else {
        setRelevantInfo(null);
      }
    })();
  }, [msgType]);

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
          error={(() => {
            if (!messages[msgType]) {
              return false;
            }

            try {
              messages[msgType].converter(JSON.parse(msgInput));
              return false;
            } catch (error) {
              return true;
            }
          })()}
          helperText={(() => {
            if (!msgType) {
              return "";
            }
            try {
              messages[msgType].converter(JSON.parse(msgInput));
            } catch (error) {
              //@ts-ignore
              return error.message;
            }
          })()}
        />
      </div>
      {loadingInfo && (
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
