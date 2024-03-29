// Copyright 2017-2022 @polkadot/app-contracts authors & contributors
// Copyright 2017-2023 @blockandpurpose.com
// SPDX-License-Identifier: Apache-2.0
// packages/page-geode/src/LifeAndWork/CallCard.tsx
import { Input, Label } from 'semantic-ui-react'

import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractCallOutcome } from '@polkadot/api-contract/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { CallResult } from '../shared/types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { LabelHelp, Badge, Card, Button, Dropdown, InputAddress, InputBalance, Toggle, TxButton } from '@polkadot/react-components';
import { useAccountId, useApi, useDebounce, useFormField, useToggle } from '@polkadot/react-hooks';
import { Available } from '@polkadot/react-query';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import { InputMegaGas, Params } from '../shared';
import { useTranslation } from '../translate';
import useWeight from '../useWeight';
import Details from './Details';
import SearchDetails from './SearchDetails';
import { getCallMessageOptions } from '../shared/util';

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
  const [isSaved, setSaved] = useState(false);

  const weight = useWeight();
  const dbValue = useDebounce(value);
  const dbParams = useDebounce(params);
  const [isCalled, toggleIsCalled] = useToggle(false);
  
  // messageIndex===0 input values;
  const [_displayName, setDisplayName] = useState('');
  const [_location, setLocation] = useState('');
  const [_tags, setTags] = useState('');
  const [_bio, setBio] = useState('');
  const [_photoUrl, setPhotoUrl] = useState('');
  const [_websiteUrl1, setWebsiteUrl1] = useState('');
  const [_websiteUrl2, setWebsiteUrl2] = useState('');
  const [_websiteUrl3, setWebsiteUrl3] = useState('');
  const [_lifeAndWork, setLifeAndWork] = useAccountId();
  const [_social, setSocial] = useAccountId();
  const [_privateMessage, setPrivateMessage] = useAccountId();
  const [_marketPlace, setMarketPlace] = useAccountId();
  const [_moreInfo, setMoreInfo] = useState('');
  const [_makePrivate, toggleMakePrivate] = useToggle(false);

  const boolToString = (_bool: boolean) => _bool? 'Yes': 'No';

  //const [isTest, setIsTest] = useToggle();
  
  const isTest: boolean = false;
  //const isTestData: boolean = false; //takes out code elements we only see for test

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
      {toggleIsCalled()}
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
  const isClosed = (isCalled && messageIndex === 1 );

  return (
    <Card >
        <h2><strong>{t<string>(' Geode Profile ')}{' '}</strong>
        {messageIndex===0 && (
          <>
            {'- Enter Your Profile Data'}</>
        )}
        {messageIndex===1 && (
          <>{'- View Profiles'}</>
        )}
        {messageIndex===2 && (
          <>{'- Search Profiles by Keyword'}</>
        )}
        {messageIndex===3 && (
          <>{'- Search Profiles by Account ID'}</>
        )}
        </h2>
        {isTest && (
          <InputAddress
          //help={t<string>('A deployed contract that has either been deployed or attached. The address and ABI are used to construct the parameters.')}
          isDisabled
          label={t<string>('contract to use')}
          type='contract'
          value={contract.address}
          />
        )}
        {!isClosed && (<>
        {messageIndex !== null && messageIndex===1 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select which of your Accounts is asking for this Profile:')}
          </>)}
        {messageIndex !== null && messageIndex===0 && (
          <><br /><br />
          <Badge color='blue' icon='1'/>
          {t<string>('Select the Account for this Profile:')}
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
            {messageIndex !== null && messageIndex===1 && (
              <>
              <Badge color='blue' icon='2'/>
              {t<string>('Select the Account whose Profile you want to view:')}
              </>)}

            {messageIndex=== 0 && (
              <>
                <Badge color='blue' icon='2'/>
                {t<string>('Enter Your Profile Data. Don`t forget to click SAVE before you submit your Profile. To make updates and changes to your profile go to Account Look up and click the Update button.')}
              </>)}
              </>)}
            
            {messageIndex!=0 && (<>
            <Params
              onChange={setParams}
              params={
                message
                  ? message.args
                  : undefined
              }              
              registry={contract.abi.registry}
            /></>)}

          {messageIndex===0 && (<>
          <br /><br /><br />

          <LabelHelp help={t<string>('Enter the Display Name.')}/>{' '}          
          <strong>{t<string>('Display Name: ')}</strong>
          <Input //label={_displayName.length>0? params[0]=stringToHex(_displayName): params[0]=displayName}
            label={_displayName.length>0? params[0]=_displayName: params[0]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(displayName))}
            value={_displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[0]? 'blue': 'grey'}>
                    {params[0]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your Location (You can leave this blank if you wish).')}/>{' '}          
          <strong>{t<string>('Location: ')}</strong>
          <Input //label={_location.length>0? params[1]=stringToHex(_location): params[1]=location}
            label={_location.length>0? params[1]=_location: params[1]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(location))}
            value={_location}
            onChange={(e) => {
              setLocation(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[1]? 'blue': 'grey'}>
                    {params[1]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your expertise and/or experience tags).')}/>{' '}          
          <strong>{t<string>('Experience and Expertise Tags: ')}</strong>
          <Input //label={_tags.length>0? params[2]=stringToHex(_tags): params[2]=tags}
            label={_tags.length>0? params[2]=_tags: params[2]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(tags))}
            value={_tags}
            onChange={(e) => {
              setTags(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[2]? 'blue': 'grey'}>
                    {params[2]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your Bio.')}/>{' '}          
          <strong>{t<string>('Bio: ')}</strong>
          <Input //label={_bio.length>0? params[3]=stringToHex(_bio): params[3]=bio}
            label={_bio.length>0? params[3]=_bio: params[3]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(bio))}
            value={_bio}
            onChange={(e) => {
              setBio(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[3]? 'blue': 'grey'}>
                    {params[3]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your Photo URL (Link to a Photo).')}/>{' '}          
          <strong>{t<string>('Photo Url: ')}</strong>
          <Input //label={_photoUrl.length>0? params[4]=stringToHex(_photoUrl): params[4]=photoUrl}
            label={_photoUrl.length>0? params[4]=_photoUrl: params[4]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(photoUrl))}
            value={_photoUrl}
            onChange={(e) => {
              setPhotoUrl(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[4]? 'blue': 'grey'}>
                    {params[4]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your First Website Link.')}/>{' '}          
          <strong>{t<string>('Website Link 1: ')}</strong>
          <Input //label={_websiteUrl1.length>0? params[5]=stringToHex(_websiteUrl1): params[5]=websiteUrl1}
            label={_websiteUrl1.length>0? params[5]=_websiteUrl1: params[5]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(websiteUrl1))}
            value={_websiteUrl1}
            onChange={(e) => {
              setWebsiteUrl1(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[5]? 'blue': 'grey'}>
                    {params[5]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your Second Website Link.')}/>{' '}          
          <strong>{t<string>('Website Link 2: ')}</strong>
          <Input //label={_websiteUrl2.length>0? params[6]=stringToHex(_websiteUrl2): params[6]=websiteUrl2}
            label={_websiteUrl2.length>0? params[6]=_websiteUrl2: params[6]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(websiteUrl2))}
            value={_websiteUrl2}
            onChange={(e) => {
              setWebsiteUrl2(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[6]? 'blue': 'grey'}>
                    {params[6]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Enter your Third Website Link.')}/>{' '}          
          <strong>{t<string>('Website Link 3: ')}</strong>
          <Input //label={_websiteUrl3.length>0? params[7]=stringToHex(_websiteUrl3): params[7]=websiteUrl3}
            label={_websiteUrl3.length>0? params[7]=_websiteUrl3: params[7]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(websiteUrl3))}
            value={_websiteUrl3}
            onChange={(e) => {
              setWebsiteUrl3(e.target.value);
              setParams([...params]);
            }}
            ><input />
            <Label color={params[7]? 'blue': 'grey'}>
                    {params[7]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <LabelHelp help={t<string>('Select Your Life and Work Account.')}/>{' '}          
          <strong>{t<string>('Life and Work Account: ')}</strong>{' '}
          {params[8] = _lifeAndWork}<br />
          <InputAddress
            defaultValue={accountId}
            label={t<string>('Life and Work Account')}
            labelExtra={
            <Available
                label={t<string>('transferrable')}
                params={_lifeAndWork}
            />
            }
            onChange={setLifeAndWork}
            type='account'
            value={_lifeAndWork}
          />

          <LabelHelp help={t<string>('Select Your Social Account.')}/>{' '}          
          <strong>{t<string>('Social Account: ')}</strong>{' '}
          {params[9] = _social}<br />
          <InputAddress
            defaultValue={accountId}
            label={t<string>('Social Account')}
            labelExtra={
            <Available
                label={t<string>('transferrable')}
                params={_social}
            />
            }
            onChange={setSocial}
            type='account'
            value={_social}
          />

          <LabelHelp help={t<string>('Select Your Private Messaging Account.')}/>{' '}          
          <strong>{t<string>('Private Messaging Account: ')}</strong>{' '}
          {params[10] = _privateMessage}<br />
          <InputAddress
            defaultValue={accountId}
            label={t<string>('Private Messaging Account')}
            labelExtra={
            <Available
                label={t<string>('transferrable')}
                params={_privateMessage}
            />
            }
            onChange={setPrivateMessage}
            type='account'
            value={_privateMessage}
          />

          <LabelHelp help={t<string>('Select Your Market Place Account.')}/>{' '}          
          <strong>{t<string>('Market Place Account: ')}</strong>{' '}
          {params[11] = _marketPlace}<br />
          <InputAddress
            defaultValue={accountId}
            label={t<string>('Market Place Account')}
            labelExtra={
            <Available
                label={t<string>('transferrable')}
                params={_marketPlace}
            />
            }
            onChange={setMarketPlace}
            type='account'
            value={_marketPlace}
          />

          <LabelHelp help={t<string>('Enter your more Information.')}/>{' '}          
          <strong>{t<string>('More Information: ')}</strong>
          <Input //label={_moreInfo.length>0? params[12]=stringToHex(_moreInfo): params[12]=moreInfo}
            label={_moreInfo.length>0? params[12]=_moreInfo: params[12]=''}
            type="text"
            //defaultValue={hextoString(paramToNum(moreInfo))}
            value={_moreInfo}
            onChange={(e) => {
              setMoreInfo(e.target.value)
              setParams([...params]);
            }}
            ><input />
            <Label color={params[12]? 'blue': 'grey'}>
                    {params[12]? <>{'OK'}</>:<>{'Enter Value'}</>}</Label>
          </Input>

          <br /><br />
          <LabelHelp help={t<string>('Select Yes/No to Hide Your Account.')}/> {' '}         
          <strong>{t<string>('Hide Account: ')}</strong>
          <br /><br />
          <Toggle
            className='booleantoggle'
            label={<strong>{t<string>(boolToString(params[13] = _makePrivate))}</strong>}
            onChange={() => {
              toggleMakePrivate()
              params[13] = !_makePrivate;
              setParams([...params]);
            }}
            value={_makePrivate}
          />
          <br />
          </>)}
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
        {!isClosed && (<>
        <Card>
        {isViaRpc
          ? (
            <Button
            icon='sign-in-alt'
            isDisabled={!isValid}
            label={t<string>('View')}
            onClick={_onSubmitRpc} 
            />
          )
          : (<>
            {messageIndex===0 && (<>
              <Button
              icon='sign-in-alt'
              //isDisabled={!isValid}
              label={t<string>('Save')}
              onClick={()=>{setSaved(true);
                            setParams([...params]);
                           }} 
            />            
            </>)}
            <TxButton
              accountId={accountId}
              extrinsic={execTx}
              icon='sign-in-alt'
              isDisabled={!isValid || !execTx || !isSaved}
              label={t('Submit')}
              onStart={onClose}
            />
          </>)
        }
        </Card></>)}

        {outcomes.length > 0 && messageIndex < 2 && (
            <div>
            {outcomes.map((outcome, index): React.ReactNode => (
              <Details
                key={`outcome-${index}`}
                onClear={_onClearOutcome(index)}
                isAccount={messageIndex===3 ? true: false}
                outcome={outcome}
              />
            ))}
            </div>
        )}
        {outcomes.length > 0 && messageIndex > 1 && (
            <div>
            {outcomes.map((outcome, index): React.ReactNode => (
              <SearchDetails
                key={`outcome-${index}`}
                onClear={_onClearOutcome(index)}
                isAccount={messageIndex > 1 ? true: false}
                outcome={outcome}
              />
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


