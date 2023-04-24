// Copyright 2017-2022 @polkadot/app-contracts authors & contributors
// Copyright 2017-2023 @blockandpurpose.com
// SPDX-License-Identifier: Apache-2.0
// packages/page-geode/src/LifeAndWork/CallCard.tsx

import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractCallOutcome } from '@polkadot/api-contract/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { CallResult } from './types';
//import { blake2AsHex } from '@polkadot/util-crypto';
//import MessageSignature from '../shared/MessageSignature';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Badge, Card, Button, Dropdown, InputAddress, InputBalance, Toggle, TxButton, LabelHelp } from '@polkadot/react-components';
import { useAccountId, useApi, useDebounce, useFormField, useToggle } from '@polkadot/react-hooks';
import { Available } from '@polkadot/react-query';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
//import { Table } from 'semantic-ui-react'

import { InputMegaGas, Params } from '../shared';
import { useTranslation } from '../translate';
import useWeight from '../useWeight';
import FeedDetails from './FeedDetails';
import PaidFeedDetails from './PaidFeedDetails';
import StatDetails from './StatDetails';
import CallPost from './CallPost';
import CallEndorse from './CallEndorse';
import CallStats from './CallStats';

//import SearchDetails from './SearchDetails';
import { getCallMessageOptions } from './util';
import JSONhelp from '../shared/geode_social_help.json';
import JSONnote from '../shared/geode_social_note.json';
import JSONTitle from '../shared/geode_social_card_titles.json';


interface Props {
  className?: string;
  contract: ContractPromise;
  messageIndex: number;
  onCallResult?: (messageIndex: number, result?: ContractCallOutcome | void) => void;
  onChangeMessage: (messageIndex: number) => void;
  onClose: () => void;
}

const MAX_CALL_WEIGHT = new BN(5_000_000_000_000).isub(BN_ONE);

function CallCard ({ className = '', contract, messageIndex, onCallResult, onChangeMessage, onClose }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const message = contract.abi.messages[messageIndex];
  const [accountId, setAccountId] = useAccountId();
  const [estimatedWeight, setEstimatedWeight] = useState<BN | null>(null);
  const [estimatedWeightV2, setEstimatedWeightV2] = useState<WeightV2 | null>(null);
  const [value, isValueValid, setValue] = useFormField<BN>(BN_ZERO);
  const [outcomes, setOutcomes] = useState<CallResult[]>([]);
  const [execTx, setExecTx] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [params, setParams] = useState<unknown[]>([]);
  const [isViaCall, toggleViaCall] = useToggle();
  const [isMenu, setIsMenu] = useState(false);
  const weight = useWeight();
  const dbValue = useDebounce(value);
  const dbParams = useDebounce(params);
  const [isTest, setIsTest] = useToggle();
  const [isPubPost, togglePubPost] = useToggle();
  const [isPaidPost, togglePaidPost] = useToggle();
  const [isEndorse, toggleEndorse] = useToggle();
  //const [isGetReply, toggleGetReply] = useToggle();
  const [isShowEndorse, toggleShowEndorse] = useToggle(false);
  const [isShowMsgID, toggleShowMsgID] = useToggle(false);
  const [isShowInterest, toggleShowInterest] = useToggle(false);
  const [isPaidEndorse, togglePaidEndorse] = useToggle(false);
  const [isShowInfo, toggleShowInfo] = useToggle(false);
  const [isStats, toggleStats] = useToggle(false);
  //const isTestData: boolean = false; //takes out code elements we only see for test
  const isShowDeveloper: boolean = true;
  
  useEffect((): void => {
    setEstimatedWeight(null);
    setEstimatedWeightV2(null);
    setParams([]);
  }, [contract, messageIndex]);

  useEffect((): void => {
    value && message.isMutating && setExecTx((): SubmittableExtrinsic<'promise'> | null => {
      try {
        return contract.tx[message.method](
          { gasLimit: weight.isWeightV2 ? weight.weightV2 : weight.weight, storageDepositLimit: null, value: message.isPayable ? value : 0 },
          ...params
        );
      } catch (error) {
        return null;
      }
    });
  }, [accountId, contract, message, value, weight, params]);

  useEffect((): void => {
    if (!accountId || !message || !dbParams || !dbValue) {
      return;
    }
    
    contract
      .query[message.method](accountId, { gasLimit: -1, storageDepositLimit: null, value: message.isPayable ? dbValue : 0 }, ...dbParams)
      .then(({ gasRequired, result }) => {
        if (weight.isWeightV2) {
          setEstimatedWeightV2(
            result.isOk
              ? api.registry.createType('WeightV2', gasRequired)
              : null
          );
        } else {
          setEstimatedWeight(
            result.isOk
              ? gasRequired
              : null
          );
        }
      })
      .catch(() => {
        setEstimatedWeight(null);
        setEstimatedWeightV2(null);
      });
  }, [api, accountId, contract, message, dbParams, dbValue, weight.isWeightV2]);

  const _onSubmitRpc = useCallback(
    (): void => {
      if (!accountId || !message || !value || !weight) {
        return;
      }
      {setIsMenu(true)}
      contract
        .query[message.method](
          accountId,
          { gasLimit: weight.isWeightV2 ? weight.weightV2 : weight.isEmpty ? -1 : weight.weight, storageDepositLimit: null, value: message.isPayable ? value : 0 },
          ...params
        )
        .then((result): void => {
          setOutcomes([{
            ...result,
            from: accountId,
            message,
            params,
            when: new Date()
          }, ...outcomes]);
          onCallResult && onCallResult(messageIndex, result);
        })
        .catch((error): void => {
          console.error(error);
          onCallResult && onCallResult(messageIndex);
        });
    },
    [accountId, contract.query, message, messageIndex, onCallResult, outcomes, params, value, weight]
  );

  const _onClearOutcome = useCallback(
    (outcomeIndex: number) =>
      () => setOutcomes([...outcomes.filter((_, index) => index !== outcomeIndex)]),
    [outcomes]
  );

  const isValid = !!(accountId && weight.isValid && isValueValid);
  const isViaRpc = (isViaCall || (!message.isMutating && !message.isPayable));      
  const _help: string[] = JSONhelp;
  const _note: string[] = JSONnote;
  const _title: string[] = JSONTitle;

  return (
    <Card >
        <h2>
        <Badge
          icon='info'
          color={(isShowInfo) ? 'blue' : 'gray'}
          onClick={toggleShowInfo}/> 
        <strong>{t<string>(' Geode Social ')}</strong>{_title[messageIndex]}
        </h2>
        {isShowInfo && (<>
          <br />{_help[messageIndex]}<br /><br />
                {_note[messageIndex]}<br />
          </>)}
        {isTest && (
          <InputAddress
          //help={t<string>('A deployed contract that has either been deployed or attached. The address and ABI are used to construct the parameters.')}
          isDisabled
          label={t<string>('contract to use')}
          type='contract'
          value={contract.address}
          />
        )}
        {messageIndex===0 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account for this Post:')}
          </>)}
        {messageIndex===1 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account for this Paid Post:')}
          </>)}
        {messageIndex===2 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for this Endorsement:')}
          </>)}
        {messageIndex===3 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for this Paid Endorsement:')}
          </>)}
        {messageIndex===4 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for Following another Account:')}
          </>)}
        {messageIndex===5 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for Unfollowing another Account:')}
          </>)}
        {messageIndex===6 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for Blocking another Account:')}
          </>)}
        {messageIndex===7 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account to Use for Unblocking another Account:')}
          </>)}
        {messageIndex===8 && (
          <><br /><br />
          <Badge color='blue' icon='thumbs-up'/>
          {t<string>('Select the Account and Update the Settings for this Account:')}
          </>)}
        {messageIndex===9 && (
          <><br /><br />
          <Badge color='blue' icon='thumbs-up'/>
          {t<string>('Select the Account for this Feed:')}
          </>)}
        {messageIndex===10 && (
          <><br /><br />
          <Badge color='blue' icon='thumbs-up'/>
          {t<string>('Select the Account for this Paid Feed:')}
          </>)}
        {messageIndex===11 && (
          <><br /><br />
          <Badge color='blue' icon='thumbs-up'/>
          {t<string>('Select the Account to use for this Account Search:')}
          </>)}
        {messageIndex===13 && (
          <><br /><br />
          <Badge color='blue' icon='thumbs-up'/>
          {t<string>('Select the Account to use for this Keyword Search:')}
          </>)}
        <InputAddress
          defaultValue={accountId}
          //help={t<string>('Specify the user account to use for this contract call. And fees will be deducted from this account.')}
          label={t<string>('account to use')}
          labelExtra={
            <Available
              label={t<string>('transferrable')}
              params={accountId}
            />
          }
          onChange={setAccountId}
          type='account'
          value={accountId}
        />

        {messageIndex !== null && (
          <>
            {isTest && (
            <>
            <Dropdown
              defaultValue={messageIndex}
              //help={t<string>('The message to send to this contract. Parameters are adjusted based on the ABI provided.')}
              isError={message === null}
              label={t<string>('Profile Item')}
              onChange={onChangeMessage}
              options={getCallMessageOptions(contract)}
              value={messageIndex}
              isDisabled
            />              
            </>
            )}
            {messageIndex===0 && (
              <><Badge color='blue' icon='2'/>
                {t<string>('Enter your Post, a photo or other link:')}
              </>)}
            {messageIndex===1 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Enter your Paid Post, a photo or other link, the Max No. of Paid Endorsers, Keyword for Interests and the sum Total Amount to spend on this Ad Post:')}
              </>)}
            {messageIndex===2 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Input the Message ID of the Post to Endorse:')}
              </>)}
            {messageIndex===3 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Input the Message ID of the Paid Post to Endorse:')}
              </>)}
            {messageIndex===4 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Select the Account to Follow:')}
              </>)}
            {messageIndex===5 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Select the Account to Unfollow:')}
              </>)}
            {messageIndex===6 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Select the Account to Block:')}
              </>)}
            {messageIndex===7 && (
              <><Badge color='blue' icon='2'/>
              {t<string>('Select the Account to Unblock:')}
              </>)}
            {messageIndex===11 && (
              <><Badge color='blue' icon='2'/>
                {t<string>('Enter the Account to Lookup:')}
              </>)}
            {messageIndex===13 && (
              <><Badge color='blue' icon='2'/>
                {t<string>('Enter the Keyword to Lookup:')}
              </>)}

            <Params
              onChange={setParams}
              params={
                message
                  ? message.args
                  : undefined
              }              
              registry={contract.abi.registry}
            />
          </>
        )}
        {message.isPayable && (
          <InputBalance
            //help={t<string>('The allotted value for this contract, i.e. the amount transferred to the contract as part of this call.')}
            isError={!isValueValid}
            isZeroable
            label={t<string>('value')}
            onChange={setValue}
            value={value}
          />
        )}
        {isTest && (
        <>
        <Badge color='green' icon='hand'/>
          {t<string>('Gas Required - Information Only')}
        <InputMegaGas
          estimatedWeight={message.isMutating ? estimatedWeight : MAX_CALL_WEIGHT}
          estimatedWeightV2={message.isMutating
            ? estimatedWeightV2
            : api.registry.createType('WeightV2', {
              proofSize: new BN(1_000_000),
              refTIme: MAX_CALL_WEIGHT
            })
          }
          help={t<string>('The maximum amount of gas to use for this contract call. If the call requires more, it will fail.')}
          isCall={!message.isMutating}
          weight={weight}
        />
        {message.isMutating && (
          <Toggle
            className='rpc-toggle'
            label={t<string>('read contract only, no execution')}
            onChange={toggleViaCall}
            value={isViaCall}
          />
        )}        
        </>
        )}
        <Card>
        {isViaRpc
          ? (
              <Button
              icon='sign-in-alt'
              isDisabled={!isValid}
              label={t<string>('View')}
              onClick={_onSubmitRpc} 
              />                
            ) : (
            <TxButton
              accountId={accountId}
              extrinsic={execTx}
              icon='sign-in-alt'
              isDisabled={!isValid || !execTx}
              label={t('Submit')}
              onStart={onClose}
            />
          )
        }
        {isMenu && (
        <>
          {messageIndex===9 && (
            <>
            {' | '}
            <Button
            icon={(isPubPost) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Post')}
            onClick={togglePubPost} 
            />
            </>
          )}
          {messageIndex===10 && (
            <>
            {' | '}
            <Button
            icon={(isPaidPost) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Paid Post')}
            onClick={togglePaidPost} 
          />
          </>
          )}
          {messageIndex===9 && (<>
            <Button
            icon={(isEndorse) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Endorse')}
            onClick={toggleEndorse} 
            />          
          </>)}   
          {messageIndex===10 && (<>
            <Button
            icon={(isPaidEndorse) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Endorse')}
            onClick={togglePaidEndorse} 
            />          
          </>)}   
          {messageIndex===10 && (<>
            <Button
            icon={(isStats) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Interest Stats')}
            onClick={toggleStats} 
            />          
          </>)}   
        
            {messageIndex!=14 && (
            <>
            {' | '}
            <Button
            icon={(isShowEndorse) ? 'minus' : 'plus'}
            //isDisabled={!isValid}
            label={t<string>('Show Endorsers')}
            onClick={toggleShowEndorse} 
            />
            </>
            )}
            {messageIndex===9 && (
            <Button
              icon={(isShowMsgID) ? 'minus' : 'plus'}
              //isDisabled={!isValid}
              label={t<string>('Show Message IDs')}
              onClick={toggleShowMsgID} 
            />
            )}
            {messageIndex===10 && (
            <Button
              icon={(isShowInterest) ? 'minus' : 'plus'}
              //isDisabled={!isValid}
              label={t<string>('Show Interest')}
              onClick={toggleShowInterest} 
            />
            )}
        {isShowDeveloper && (<>
          {' | '}
            <Button
              icon={(isTest) ? 'minus' : 'plus'}
              //isDisabled={!isValid}
              label={t<string>('Developer')}
              onClick={setIsTest} 
            />        
        </>)}
          </>
        )} 
        </Card>
        {isPubPost && (
          <><CallPost 
            isPost={true}
          /></>
        )}
        {isPaidPost && (
          <><CallPost 
            isPost={false}
          /></>
        )}
        {isEndorse && (
          <><CallEndorse
          isPost={true} /></>
        )}
        {isPaidEndorse && (
          <><CallEndorse
          isPost={false} /></>
        )}
        {isStats && (
          <><CallStats /></>
        )}
        {outcomes.length > 0 && messageIndex===9 && (
            <div>
            {outcomes.map((outcome, index): React.ReactNode => (
              <>
              <FeedDetails
                key={`outcome-${index}`}
                onClear={_onClearOutcome(index)}
                isShowEndorsers={isShowEndorse}
                isShowMessageID={isShowMsgID}
                outcome={outcome}
              />
              {isTest && (<>{JSON.stringify(outcome.output)}</>)}
              </>
            ))}
            </div>
        )}
        {outcomes.length > 0 && messageIndex===10 && (
            <div>
            {outcomes.map((outcome, index): React.ReactNode => (
              <>
              <PaidFeedDetails
                key={`outcome-${index}`}
                onClear={_onClearOutcome(index)}
                isShowEndorsers={isShowEndorse}
                isShowInterest={isShowInterest}
                outcome={outcome}
              />
              {isTest && (<>{JSON.stringify(outcome.output)}</>)}
              </>
            ))}
            </div>
        )}
        {outcomes.length > 0 && messageIndex===14 && (
            <div>
            {outcomes.map((outcome, index): React.ReactNode => (
              <>
              <StatDetails
                key={`outcome-${index}`}
                onClear={_onClearOutcome(index)}
                outcome={outcome}
              />
              {isTest && (<>{JSON.stringify(outcome.output)}</>)}
              </>
            ))}
            </div>
        )}
        </Card>
  );
}

export default React.memo(styled(CallCard)`
  .rpc-toggle {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }
  .clear-all {
    float: right;
  }
  .outcomes {
    margin-top: 1rem;
  }
`);


