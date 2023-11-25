// Copyright 2017-2023 @blockandpurpose.com
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { useContracts } from '../useContracts';
import { useCodes } from '../useCodes';
import styled from 'styled-components';
import { __RouterContext } from 'react-router';
import ContractsTable from './ContractsTable';
import ContractsModal from './ContractsModal';

interface Props {
  className?: string;
  onClear?: () => void;
  messageId?: string;
  fromAcct?: string;
  toAcct?: string;
  username?: string;
  postMessage?: string;
  onReset?: () => void;
  callIndex: number;
}

function CallSendMessage ({ className = '', onClear, messageId, fromAcct, toAcct, username, postMessage, callIndex, onReset }: Props): React.ReactElement<Props> | null {
    const { allContracts } = useContracts();
    const { allCodes, codeTrigger } = useCodes();
//todo: code for allCodes:
    console.log(JSON.stringify(allCodes));

    function SendMessage(): JSX.Element {
    return(
        <div>
          {(callIndex===0  || callIndex===1  || 
            callIndex===2  || callIndex===4  || 
            callIndex===5  || callIndex===6  ||
            callIndex===27 || callIndex===29) ? <>
            <ContractsModal
                toAcct={toAcct}
                messageId={messageId}
                username={username}
                contracts={allContracts}
                updated={codeTrigger}
                initMessageIndex={callIndex}
            />                                   
            </>: <>
            <ContractsTable
                contracts={allContracts}
                updated={codeTrigger}
                initMessageIndex={callIndex}
            />                                   
            </>}
        </div>
    )
}

  return (
    <StyledDiv className={className}>
      <SendMessage />
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  align-items: center;
  display: flex;

  .output {
    flex: 1 1;
    margin: 0.25rem 0.5rem;
  }
`;

export default React.memo(CallSendMessage);


