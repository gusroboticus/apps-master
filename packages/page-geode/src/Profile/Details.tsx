// Copyright 2017-2023 @polkadot/app-whitelist authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
//import React, { useState } from 'react';
import { useTranslation } from '../translate';
import type { CallResult } from './types';
import styled from 'styled-components';
import { stringify, hexToString, isHex } from '@polkadot/util';
import { Button, AccountName, LabelHelp, IdentityIcon, Card } from '@polkadot/react-components';
import { Table, Label, Image } from 'semantic-ui-react'
import CopyInline from '../shared/CopyInline';

import JSONprohibited from '../shared/geode_prohibited.json';

interface Props {
    className?: string;
    onClear?: () => void;
    isAccount?: boolean;
    outcome: CallResult;
    //onClose: () => void;
  }
  
  type ProfileObj = {
    account: string,
    displayName: number,
    location: number,
    tags: number,
    bio: number,
    photoUrl: number,
    websiteUrl1: number,
    websiteUrl2: number,
    websiteUrl3: number,
    lifeAndWork: string,
    social: string,
    privateMessaging: string,
    marketplace: string,
    moreInfo: number,
    makePrivate: boolean
  }
  
  type ProfileDetail = {
  ok: ProfileObj
  }
  
function Details ({ className = '', onClear, isAccount, outcome: { from, message, output, params, result, when } }: Props): React.ReactElement<Props> | null {
    const defaultImage: string ='https://react.semantic-ui.com/images/wireframe/image.png';
    const { t } = useTranslation();
    const searchWords: string[] = JSONprohibited;

    //let _Obj1: Object = {"ok":[{"account":"5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc","display_name":"0x49276d20616e206578706572742047726f706f","location":"0x4a3252d1668288f51bb269a6c27c11fca6b227a79db2ec2e726180a1f845f02f","tags":"0x","bio":"0x68747470733a2f2f646576656c6f7065722e6d6f7a696c6c612e6f72672f656e2d55532f646f63732f5765622f4150492f46696c65526561646572","photo_url":"0x","website_url1":"0x", "website_url2":"0x", "website_url3":"0x", "life_and_work": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc", "social": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc", "private_messaging": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc", "marketplace": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc", "more_info": "0x", "make_private": false}]};
    let _Obj: Object = { Ok: { "account": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "displayName": "test q", "location": "test w", "tags": "test r", "bio": "0x", "photoUrl": "0x", "websiteUrl1": "0x", "websiteUrl2": "0x", "websiteUrl3": "0x", "lifeAndWork": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "social": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "privateMessaging": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "marketplace": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "moreInfo": "0x", "makePrivate": false } }
    const objOutput: string = stringify(output);
    _Obj = JSON.parse(objOutput);
    const profileDetail: ProfileDetail = Object.create(_Obj);
    const withHttp = (url: string) => url.replace(/^(?:(.*:)?\/\/)?(.*)/i, (match, schemma, nonSchemmaUrl) => schemma ? match : `http://${nonSchemmaUrl}`);


    function autoCorrect(arr: string[], str: string): JSX.Element {
        arr.forEach(w => str = str.replaceAll(w, '****'));
        arr.forEach(w => str = str.replaceAll(w.charAt(0).toUpperCase() + w.slice(1), '****'));
        arr.forEach(w => str = str.replaceAll(w.charAt(0) + w.slice(1).toUpperCase, '****'));        
        arr.forEach(w => str = str.replaceAll(w.toUpperCase(), '****'));
        return (
        <>{t<string>(str)}</>)
    }

    function ListAccount(): JSX.Element {
      try {
        //setIsClaim(true)
        return (
          <div>
            <Table>
              <Table.Row>
              <Table.Cell>
                </Table.Cell>
                <Table.Cell>
                <LabelHelp help={t<string>(' The account calling the information.')} /> 
                <strong>{t<string>(' Called from: ')}</strong>
                <IdentityIcon value={from} />
                <AccountName value={from} withSidebar={true}/>
                </Table.Cell>
      
                <Table.Cell>
                <strong>{t<string>('Date/Time: ')}</strong>
                {' '}{when.toLocaleDateString()} 
                {' '}{when.toLocaleTimeString()} 
                </Table.Cell>
                <Table.Cell>
                <strong>{t<string>(' Key: ')}</strong>
                {t<string>(' Link to See More: ')}
                <Label circular color='orange'> Link </Label>  
                </Table.Cell>
                <Table.Cell>
                <Button
                  icon='times'
                  label={t<string>('Close')}
                  onClick={onClear}
                />
                </Table.Cell>

              </Table.Row>
            </Table>
          </div>
        )
      } catch(error) {
        console.error(error)
        //setIsClaim(false)
        return(
          <div>
          <Table>
            <Table.Row>
              <Table.Cell>
              <strong>{t<string>('There are no profiles available.')}</strong>
              </Table.Cell>
              <Table.Cell>
              <strong>{t<string>('Date/Time: ')}</strong>
                {' '}{when.toLocaleDateString()} 
                {' '}{when.toLocaleTimeString()} 
              </Table.Cell>
            </Table.Row>
          </Table>
          </div>
        )
      }}
      
function ShowProfile(): JSX.Element {
      try {
        const avatarImage: string = (isHex(profileDetail.ok.photoUrl) ? withHttp(hexToString(profileDetail.ok.photoUrl).trim()) : defaultImage);
        const link1: string = (isHex(profileDetail.ok.websiteUrl1) ? withHttp(hexToString(profileDetail.ok.websiteUrl1).trim()) : '');
        const link2: string = (isHex(profileDetail.ok.websiteUrl2) ? withHttp(hexToString(profileDetail.ok.websiteUrl2).trim()) : '');
        const link3: string = (isHex(profileDetail.ok.websiteUrl3) ? withHttp(hexToString(profileDetail.ok.websiteUrl3).trim()) : '');

        return(
          <div>
          <Table stretch>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <h2><strong>{isHex(profileDetail.ok.displayName) ? 
                autoCorrect(searchWords, hexToString(profileDetail.ok.displayName)) 
                : ' '}</strong></h2>
              </Table.HeaderCell>
              <Table.HeaderCell>
                <h2>{profileDetail.ok.account}</h2>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Row>
            <Table.Cell verticalAlign='top'>
                {avatarImage !='' ? 
                (
                  <>
                    <Image src={avatarImage} size='small' circular />
                  </>
                ) : (
                  <>
                    <Image src={defaultImage} size='small' circular />
                  </>
                )
                }
                <br /><br />
                <i>{isHex(profileDetail.ok.location) ?
                      autoCorrect(searchWords, hexToString(profileDetail.ok.location)) 
                      : ' '}</i><br /><br />
                <strong>{isHex(profileDetail.ok.tags) ? 
                      autoCorrect(searchWords, hexToString(profileDetail.ok.tags))
                      : ' '}</strong>
                      <br /><br />
                      <h3><LabelHelp help={t<string>(' Web sites associated with this profile. ')} />                
                <strong>{t<string>(' My Web Site(s): ')}</strong></h3>                  
                
                {link1 != 'http://' && (
                  <>
                  <Label  as='a'
                  color='orange'
                  circular
                  href={link1} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >{'Link'}
                  </Label>{' '}
                  {link1}
                  </>
                )}<br />
                
                {link2 != 'http://' && (
                  <>
                  <Label  as='a'
                  color='orange'
                  circular
                  href={isHex(profileDetail.ok.websiteUrl2) ? hexToString(profileDetail.ok.websiteUrl2) : ' '}
                  target="_blank" 
                  rel="noopener noreferrer"
                  >{'Link'}
                  </Label>{' '}
                  {link2}
                  </>
                )}<br />
                 
                {link3 != 'http://' && (
                  <>
                  <Label  as='a'
                  color='orange'
                  circular
                  href={isHex(profileDetail.ok.websiteUrl3) ? hexToString(profileDetail.ok.websiteUrl3) : ' '}
                  target="_blank" 
                  rel="noopener noreferrer"
                  >{'Link'}
                  </Label>{' '}
                  {link3}
                  </>
                )}<br />


            </Table.Cell>
            <Table.Cell verticalAlign='top'>
                <h3><LabelHelp help={t<string>(' Profile Acount Biography. ')} />
                <strong>{t<string>(' Bio: ')}</strong></h3> 
                {isHex(profileDetail.ok.bio) ? 
                  autoCorrect(searchWords, hexToString(profileDetail.ok.bio))
                  : ' '}
                <br /><br />        

                <h3><LabelHelp help={t<string>(' Accounts associated with the other Geode Applications. ')} />
                <strong>{t<string>(' Find Me On Geode Apps: ')}</strong></h3><br />
                {profileDetail.ok.account && (
                    <>
                    <IdentityIcon value={profileDetail.ok.account} />
                    <strong>{t<string>('  Profile:  ')}</strong>
                    <AccountName value={profileDetail.ok.account} withSidebar={true}/>
                    {' - '}{profileDetail.ok.account}{' '}
                    <CopyInline value={profileDetail.ok.account} label={''}/>
                    <br />
                    </>
                )}                
                {profileDetail.ok.lifeAndWork && (
                    <>
                    <IdentityIcon value={profileDetail.ok.lifeAndWork} />
                    <strong>{t<string>('  Life and Work:  ')}</strong>
                    <AccountName value={profileDetail.ok.lifeAndWork} withSidebar={true}/>
                    {' - '}{profileDetail.ok.lifeAndWork}{' '}
                    <CopyInline value={profileDetail.ok.lifeAndWork} label={''}/>
                    <br />
                    </>
                )}
                {profileDetail.ok.social && (
                    <>
                    
                    <IdentityIcon value={profileDetail.ok.social} />
                    <strong>{t<string>('  Social:  ')}</strong>
                    <AccountName value={profileDetail.ok.social} withSidebar={true}/>
                    {' - '}{profileDetail.ok.social}{' '}
                    <CopyInline value={profileDetail.ok.social} label={''}/>
                    <br />
                    </>
                )}
                {profileDetail.ok.privateMessaging && (
                    <>
                    <IdentityIcon value={profileDetail.ok.privateMessaging} />
                    <strong>{t<string>('  Private Messaging:  ')}</strong>
                    <AccountName value={profileDetail.ok.privateMessaging} withSidebar={true}/>
                    {' - '}{profileDetail.ok.privateMessaging}{' '}
                    <CopyInline value={profileDetail.ok.privateMessaging} label={''}/>                    
                    <br />
                    </>
                )}
                {profileDetail.ok.marketplace && (
                    <>
                    <IdentityIcon value={profileDetail.ok.marketplace} />
                    <strong>{t<string>('  Market Place:  ')}</strong>
                    <AccountName value={profileDetail.ok.marketplace} withSidebar={true}/>
                    {' - '}{profileDetail.ok.marketplace}
                    <CopyInline value={profileDetail.ok.marketplace} label={''}/>                    
                    <br />
                    </>
                )}


                <h3><LabelHelp help={t<string>(' Additional Profile Information. ')} />
                <strong>{t<string>(' More Info: ')}</strong></h3>
                {isHex(profileDetail.ok.moreInfo) ? 
                      autoCorrect(searchWords, hexToString(profileDetail.ok.moreInfo)) : ' '}
                <br />    
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell verticalAlign='top'>
            </Table.Cell>
            <Table.Cell verticalAlign='top'>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell verticalAlign='top'>
            </Table.Cell>
          </Table.Row>
      </Table>
      </div>   
      )
    } catch(e) {
      console.log(e);
      return(
        <div>
          <Card>{t<string>('No Profile Data')}</Card>
        </div>
      )
    }
}
    

  return (
    <StyledDiv className={className}>
    <Card>
      <ListAccount />
      <ShowProfile />
    </Card>
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
export default React.memo(Details);
