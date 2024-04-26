import React, { useState } from 'react';
import './lead.scss';
import { Button, Radio, Switch, message } from 'antd';
import { useCookies } from 'react-cookie';

function Lead({ chatbotId }: any) {
  const [cookies, setCookies] = useCookies(['userId']);

  const [title, setTitle] = useState('Let us know how to contact you');
  // To check switch value. Initially all false.
  const [switchValue, setSwitchValue] = useState({
    name: false,
    email: false,
    number: false,
  });

  // Radio  button group for selecting the type of lead source. Default is do-not-collect
  const [collectUserDetail, setCollectUserDetail] = useState('do-not-collect');
  const onChange = (e: any) => {
    console.log('radio checked', e.target.value);
    setCollectUserDetail(e.target.value);
  };

  // State for initially setup all leads field values
  const [leadFieldValues, setLeadFieldValues] = useState({
    name: 'Name',
    email: 'Email',
    number: 'Number',
  });

  // Save btn functionality

  const updateLeads = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
        {
          method: 'PUT',
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
            leadTitle: title,
            userDetails: collectUserDetail,
            leadFields: [
              leadFieldValues?.name,
              leadFieldValues?.email,
              leadFieldValues?.number,
            ],
          }),
          next: { revalidate: 0 },
        }
      );
      if (!res.ok) {
        throw await res.json();
      }
      /// displaying status
      const data = await res.json();

      message.success(data?.message);
    } catch (error: any) {
      message.error(error?.message);
    }
  };

  return (
    <>
      <div className='lead-container'>
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
          }}
        >
          <div className='title-container'>
            <p className='title-message-text'>Title</p>
            <Button
              type='text'
              className='title-message-button'
              onClick={(e) => {
                setTitle('Let us know how to contact you');
              }}
            >
              Reset
            </Button>
          </div>

          <input
            type='text'
            className='title-input'
            placeholder='Let us know how to contact you'
            defaultValue={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            value={title}
          />
        </div>

        <hr className='horizonal-line' />

        <div className='collect-user-detail'>
          <p className='title'>Collect User Detail</p>
          <p className='sub-title'>
            Choose whether or not you want to collect the user details.
          </p>

          <div className='radio-btns'>
            <Radio.Group onChange={onChange} value={collectUserDetail}>
              <div className='radio-btn' id='do-not-collect'>
                <Radio value={'do-not-collect'}>
                  <div className='radio-info'>
                    <p className='info-title'>Do Not Collect</p>
                    <p className='info-subtitle'>
                      We will not collect any user details at any moment
                    </p>
                  </div>
                </Radio>
              </div>

              <div className='radio-btn' id='collect'>
                <Radio value={'collect'}>
                  <div className='radio-info'>
                    <p className='info-title'>Optional</p>
                    <p className='info-subtitle'>
                      User should be able to chat by skipping the form
                    </p>
                  </div>
                </Radio>
              </div>

              <div className='radio-btn'>
                <Radio value={'mandatory'}>
                  <div className='radio-info' id='mandatory'>
                    <p className='info-title'>Mandatory</p>
                    <p className='info-subtitle'>
                      User has to enter their details before they can continue
                      chatting
                    </p>
                  </div>
                </Radio>
              </div>
            </Radio.Group>
          </div>
        </div>

        <hr className='horizonal-line' />

        <div className='leads-field'>
          <p className='title'>Lead Fields</p>
          <p className='sub-title'>
            Choose what information you want to collect from visitors.
          </p>

          <div className='collect-detail'>
            <div className='detail-field'>
              <p>Name</p>
              <Switch
                onChange={(checked) => {
                  setSwitchValue({
                    ...switchValue,
                    name: checked,
                  });
                }}
              />
            </div>
            {switchValue.name && (
              <>
                <div className='field-input'>
                  <input
                    type='text'
                    className='title-input'
                    placeholder='Name'
                    defaultValue={leadFieldValues?.name}
                    onChange={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        name: e.target.value,
                      });
                    }}
                    value={leadFieldValues.name ? leadFieldValues.name : ''}
                  />

                  <Button
                    type='text'
                    className='reset-button'
                    onClick={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        name: 'Name',
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </>
            )}

            <div className='detail-field'>
              <p>Email Address</p>
              <Switch
                onChange={(checked) => {
                  setSwitchValue({
                    ...switchValue,
                    email: checked,
                  });
                }}
              />
            </div>

            {switchValue.email && (
              <>
                <div className='field-input'>
                  <input
                    type='text'
                    className='title-input'
                    placeholder='Email'
                    defaultValue={leadFieldValues?.email}
                    onChange={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        email: e.target.value,
                      });
                    }}
                    value={leadFieldValues.email ? leadFieldValues.email : ''}
                  />

                  <Button
                    type='text'
                    className='reset-button'
                    onClick={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        email: 'Email',
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </>
            )}

            <div className='detail-field'>
              <p>Phone Number</p>
              <Switch
                onChange={(checked) => {
                  setSwitchValue({
                    ...switchValue,
                    number: checked,
                  });
                }}
              />
            </div>

            {switchValue.number && (
              <>
                <div className='field-input'>
                  <input
                    type='text'
                    className='title-input'
                    placeholder='Number'
                    defaultValue={leadFieldValues?.number}
                    onChange={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        number: e.target.value,
                      });
                    }}
                    value={leadFieldValues.number ? leadFieldValues.number : ''}
                  />

                  <Button
                    type='text'
                    className='reset-button'
                    onClick={(e) => {
                      setLeadFieldValues({
                        ...leadFieldValues,
                        number: 'Number',
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <Button type='primary' className='save-btn' onClick={updateLeads}>
          Save
        </Button>
      </div>
    </>
  );
}

export default Lead;
