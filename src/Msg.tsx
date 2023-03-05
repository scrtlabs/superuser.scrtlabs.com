import useUrlState from "@ahooksjs/use-url-state";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import {
  coinFromString,
  coinsFromString,
  Msg,
  MsgBeginRedelegate,
  MsgBeginRedelegateParams,
  MsgCreateValidator,
  MsgCreateValidatorParams,
  MsgCreateVestingAccount,
  MsgCreateVestingAccountParams,
  MsgDelegate,
  MsgDelegateParams,
  MsgDeposit,
  MsgDepositParams,
  MsgEditValidator,
  MsgEditValidatorParams,
  MsgExec,
  MsgExecParams,
  MsgExecuteContract,
  MsgExecuteContractParams,
  MsgFundCommunityPool,
  MsgFundCommunityPoolParams,
  MsgGrant,
  MsgGrantAllowance,
  MsgGrantAllowanceParams,
  MsgInstantiateContract,
  MsgInstantiateContractParams,
  MsgMultiSend,
  MsgMultiSendParams,
  MsgRevoke,
  MsgRevokeParams,
  MsgRevokeAllowance,
  MsgRevokeAllowanceParams,
  MsgSend,
  MsgSendParams,
  MsgSetWithdrawAddress,
  MsgSetWithdrawAddressParams,
  MsgStoreCode,
  MsgStoreCodeParams,
  MsgSubmitProposal,
  MsgSubmitProposalParams,
  MsgTransfer,
  MsgTransferParams,
  MsgUndelegate,
  MsgUndelegateParams,
  MsgUnjail,
  MsgUnjailParams,
  MsgVote,
  MsgVoteParams,
  MsgVoteWeighted,
  MsgVoteWeightedParams,
  MsgWithdrawDelegatorReward,
  MsgWithdrawDelegatorRewardParams,
  MsgWithdrawValidatorCommission,
  MsgWithdrawValidatorCommissionParams,
  SecretNetworkClient,
  selfDelegatorAddressToValidatorAddress,
  toBase64,
  MsgSetAutoRestake,
  MsgSetAutoRestakeParams,
} from "secretjs";

type SupportedMessage =
  | MsgBeginRedelegate
  | MsgCreateValidator
  | MsgCreateVestingAccount
  | MsgDelegate
  | MsgDeposit
  | MsgEditValidator
  | MsgExec
  | MsgExecuteContract<any>
  | MsgFundCommunityPool
  | MsgGrant
  | MsgGrantAllowance
  | MsgInstantiateContract
  | MsgMultiSend
  | MsgRevoke
  | MsgRevokeAllowance
  | MsgSend
  | MsgSetWithdrawAddress
  | MsgStoreCode
  | MsgSubmitProposal
  | MsgTransfer
  | MsgUndelegate
  | MsgUnjail
  | MsgVote
  | MsgVoteWeighted
  | MsgWithdrawDelegatorReward
  | MsgWithdrawValidatorCommission
  | MsgSetAutoRestake;

export const messages: {
  [name: string]: {
    module: string;
    example: (secretjs: SecretNetworkClient, old: any) => object;
    converter: (input: any) => SupportedMessage;
    relevantInfo?: (secretjs: SecretNetworkClient) => Promise<any>;
  };
} = {
  MsgSend: {
    module: "bank",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.from_address = secretjs.address;
        return old;
      }

      return {
        from_address: secretjs.address,
        to_address: "secret1example",
        amount: "1uscrt",
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinsFromString(input.amount);
      return new MsgSend(input);
    },
    relevantInfo: msgSendRelevantInfo,
  },
  MsgDelegate: {
    module: "staking",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.delegator_address = secretjs.address;
        return old;
      }

      return {
        delegator_address: secretjs.address,
        validator_address: "secretvaloper1example",
        amount: "1uscrt",
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinFromString(input.amount);
      return new MsgDelegate(input);
    },
    relevantInfo: msgDelegateRelevantInfo,
  },
  MsgSetAutoRestake: {
    module: "distribution",
    example: (
      secretjs: SecretNetworkClient,
      old: any
    ): MsgSetAutoRestakeParams => {
      if (old) {
        old.delegator_address = secretjs.address;
        return old;
      }

      return {
        delegator_address: secretjs.address,
        validator_address: "secretvaloper1example",
        enabled: true,
      };
    },
    converter: (input: any): SupportedMessage => {
      return new MsgSetAutoRestake(input);
    },
    relevantInfo: msgDelegateRelevantInfo,
  },
  MsgBeginRedelegate: {
    module: "staking",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.delegator_address = secretjs.address;
        return old;
      }

      return {
        delegator_address: secretjs.address,
        validator_src_address: "secretvaloper1example1",
        validator_dst_address: "secretvaloper1example2",
        amount: "1uscrt",
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinFromString(input.amount);
      return new MsgBeginRedelegate(input);
    },
    relevantInfo: msgDelegateRelevantInfo,
  },
  MsgCreateValidator: {
    module: "staking",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.delegator_address = secretjs.address;
        return old;
      }

      return {
        delegator_address: secretjs.address,
        commission: {
          max_change_rate: 0.01, // can change +-1% every 24h
          max_rate: 0.1, // 10%
          rate: 0.05, // 5%
        },
        description: {
          moniker: "My validator's display name",
          identity: "ID on keybase.io, to have a logo on explorer and stuff",
          website: "example.com",
          security_contact: "security@example.com",
          details: "We are good",
        },
        pubkey: toBase64(new Uint8Array(32).fill(1)), // validator tendermit pubkey
        min_self_delegation: "1", // uscrt
        initial_delegation: "1uscrt",
      };
    },
    converter: (input: any) => {
      input.initial_delegation = coinFromString(input.amount);
      return new MsgCreateValidator(input);
    },
  },
  MsgCreateVestingAccount: {
    module: "vesting",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.from_address = secretjs.address;
        return old;
      }

      return {
        from_address: secretjs.address,
        to_address: "secret1example",
        amount: "1uscrt",
        end_time: "2020-09-15T14:00:00Z",
        delayed: false,
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinsFromString(input.amount);
      return new MsgCreateVestingAccount(input);
    },
  },
  MsgDeposit: {
    module: "gov",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.depositor = secretjs.address;
        return old;
      }

      return {
        depositor: secretjs.address,
        proposal_id: "1",
        amount: "1uscrt",
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinsFromString(input.amount);
      return new MsgDeposit(input);
    },
  },
  MsgEditValidator: {
    module: "staking",
    example: (
      secretjs: SecretNetworkClient,
      old: any
    ): MsgEditValidatorParams => {
      if (old) {
        old.validator_address = selfDelegatorAddressToValidatorAddress(
          secretjs.address
        );
        return old;
      }

      return {
        validator_address: selfDelegatorAddressToValidatorAddress(
          secretjs.address
        ),
        // optional: if description is provided it updates all values
        description: {
          moniker: "My new validator's display name",
          identity: "ID on keybase.io, to have a logo on explorer and stuff",
          website: "edited-example.com",
          security_contact: "security@edited-example.com",
          details: "We are good probably",
        },
        commission_rate: 0.04, // optional: 4% commission cannot be changed more than once in 24h
        min_self_delegation: "3", // optional: 3uscrt
      };
    },
    converter: (input: any): SupportedMessage => new MsgEditValidator(input),
  },
  // MsgExec: {
  //   module: "authz",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  MsgExecuteContract: {
    module: "compute",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.sender = secretjs.address;
        return old;
      }

      return {
        sender: secretjs.address,
        contract_address: "secret1example",
        msg: {
          create_viewing_key: {
            entropy: "bla bla",
          },
        },
        code_hash: "abcdefg", // optional
        sent_funds: "1uscrt", // optional
      };
    },
    converter: (input: any): SupportedMessage => {
      input.sent_funds = coinsFromString(input.sent_funds);
      return new MsgExecuteContract(input);
    },
  },
  MsgFundCommunityPool: {
    module: "distribution",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.depositor = secretjs.address;
        return old;
      }

      return {
        depositor: secretjs.address,
        amount: "1uscrt",
      };
    },
    converter: (input: any): SupportedMessage => {
      input.amount = coinsFromString(input.amount);
      return new MsgFundCommunityPool(input);
    },
  },
  // MsgGrant: {
  //   module: "authz",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgGrantAllowance: {
  //   module: "feegrant",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  MsgInstantiateContract: {
    module: "compute",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.sender = secretjs.address;
        return old;
      }

      return {
        sender: secretjs.address,
        code_id: 1,
        init_msg: {
          gm: {
            hello: "world",
          },
        },
        label: "gm",
        init_funds: "1uscrt", // optional
        code_hash: "abcdefg", // optional
      };
    },
    converter: (input: any): SupportedMessage =>
      new MsgInstantiateContract(input),
  },
  MsgMultiSend: {
    module: "bank",
    example: (secretjs: SecretNetworkClient, old: any): object => {
      if (old) {
        old.inputs[0].address = secretjs.address;
        return old;
      }

      return {
        inputs: [
          {
            address: secretjs.address,
            coins: "2uscrt",
          },
        ],
        outputs: [
          {
            address: "secret1example",
            coins: "1uscrt",
          },
          {
            address: "secret1example",
            coins: "1uscrt",
          },
        ],
      };
    },
    converter: (input: any): SupportedMessage => {
      for (let i = 0; i < input.inputs.length; i++) {
        input.inputs[i].coins = coinsFromString(input.inputs[i].coins);
      }
      for (let i = 0; i < input.outputs.length; i++) {
        input.outputs[i].coins = coinsFromString(input.outputs[i].coins);
      }
      return new MsgMultiSend(input);
    },
    relevantInfo: msgSendRelevantInfo,
  },
  // MsgRevoke: {
  //   module: "authz",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgRevokeAllowance: {
  //   module: "feegrant",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgSetWithdrawAddress: {
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgStoreCode: {
  //   module: "compute",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgSubmitProposal: {
  //   module: "gov",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgTransfer: {
  //   module: "ibc-transfer",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgUndelegate: {
  //   module: "staking",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgUnjail: {
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgVote: {
  //   module: "gov",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgVoteWeighted: {
  //   module: "gov",
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgWithdrawDelegatorReward: {
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): SupportedMessage => {},
  // },
  // MsgWithdrawValidatorCommission: {
  //   example: (secretjs: SecretNetworkClient,old:any): object => ({}),
  //   converter: (input: any): MsgWithdrawValidatorCommission => {},
  // },
};

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
          sx={{ width: "20rem" }}
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

const balanceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
}).format;

async function msgSendRelevantInfo(
  secretjs: SecretNetworkClient
): Promise<any> {
  const { balances } = await secretjs.query.bank.allBalances({
    address: secretjs.address,
  });

  let result = balances
    ?.sort((a, b) => (a.denom === "uscrt" ? -1 : 1))
    .map((c) => (
      <tr key={`${c.amount}${c.denom}`}>
        <td>{c.amount}</td>
        <td>{c.denom}</td>
        <td>
          {c.denom === "uscrt"
            ? `${balanceFormat(Number(c.amount) / 1e6)} SCRT`
            : ""}
        </td>
      </tr>
    ));

  if (result) {
    if (balances?.length === 0) {
      return "No balance";
    } else {
      return (
        <table>
          <thead>
            <tr>
              <th>Balance</th>
              <th>Denom</th>
              <th>Pretty</th>
            </tr>
          </thead>
          <tbody>{result}</tbody>
        </table>
      );
    }
  } else {
    return "No balance";
  }
}

async function msgDelegateRelevantInfo(
  secretjs: SecretNetworkClient
): Promise<any> {
  const { balance } = await secretjs.query.bank.balance({
    address: secretjs.address,
    denom: "uscrt",
  });

  const { delegation_responses } =
    await secretjs.query.staking.delegatorDelegations({
      delegator_addr: secretjs.address,
    });

  const pendingRewards: { [validator: string]: string } = {};
  for (const d of delegation_responses || []) {
    const validator = d.delegation?.validator_address!;
    const { rewards } = await secretjs.query.distribution.delegationRewards({
      delegator_address: secretjs.address,
      validator_address: validator,
    });

    pendingRewards[validator] =
      rewards
        ?.map(
          (r) =>
            `${Math.floor(Number(r.amount))}${r.denom} (${balanceFormat(
              Math.floor(Number(r.amount)) / 1e6
            )} SCRT)`
        )
        .join(",") || "";
  }

  const delegations = delegation_responses?.map((d) => {
    return (
      <tr key={`${d.delegation?.validator_address}`}>
        <td>{`${d.balance?.amount}${d.balance?.denom}`}</td>
        <td>{d.delegation?.validator_address}</td>
        <td>{pendingRewards[d.delegation?.validator_address!]}</td>
      </tr>
    );
  });

  return (
    <table>
      <thead>
        <tr>
          <th>
            Balance:{" "}
            {`${balance?.amount || 0}${
              balance?.denom || "uscrt"
            } (${balanceFormat(Number(balance?.amount || 0) / 1e6)} SCRT)`}
          </th>
        </tr>
        {delegations?.length !== 0 ? (
          <tr>
            <th>Delegation</th>
            <th>Validator</th>
            <th>Pending Rewards</th>
          </tr>
        ) : (
          <tr>
            <th>No delegations</th>
          </tr>
        )}
      </thead>
      <tbody>{delegations}</tbody>
    </table>
  );
}
