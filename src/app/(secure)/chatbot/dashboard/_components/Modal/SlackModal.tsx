import React, { useEffect, useState } from 'react';
import { Button, Modal, message } from 'antd';
import './slack-modal.scss';
import axios from 'axios';

function SlackModal({
  isSlackModalOpen,
  setIsSlackModalOpen,
  userId,
  chatbotId,
  setIsSlackConnected,
  isSlackConnected,
}: any) {
  const [loading, setLoading] = useState(false);
  const [slackData, setSlackData] = useState({
    appId: '',
    authOToken: '',
  });
  const [error, setError] = useState('');
  const [disableInput, setDisableInput] = useState(false);
  const [recordId, setRecordId] = useState('');

  // function for creating slack account
  function handleOk() {
    if (!slackData.appId.trim() || !slackData.authOToken.trim()) {
      setError('Please fill in all fields');
      return;
    }
    const body = {
      ...slackData,
      userId: userId,
      chatBotId: chatbotId,
    };

    try {
      axios
        .post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/slack-bot-integration/api
        `,
          body
        )
        .then((res) => {
          console.log('pppppp', res);

          message.success(res?.data?.message);
          setIsSlackModalOpen(false);
          setIsSlackConnected(true);
          setDisableInput(true);
          getSlackData();
        })
        .catch((error) => {
          console.log('ooooo', error);

          message.error(error?.response?.data.message);
        });
    } catch (error: any) {
      message.error(error);
    }
  }

  // function for deleting the slack acc
  function handleDelete() {
    try {
      axios
        .delete(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/slack-bot-integration/api?recordId=${recordId}
        `
        )
        .then((res) => {
          message.success(res?.data?.message);
          setIsSlackModalOpen(false);
          setIsSlackConnected(false);
          setDisableInput(false);
          setSlackData({
            appId: '',
            authOToken: '',
          });
        })
        .catch((error) => {
          console.log(error);

          message.error(error?.response?.data?.message);
        });
    } catch (error: any) {
      message.error(error);
    }
  }

  const getSlackData = () => {
    try {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/slack-bot-integration/api?chatBotId=${chatbotId}
        `
        )
        .then((res) => {
          console.log('......', res);

          setSlackData((slackData) => ({
            ...slackData,
            appId: res?.data?.data?.appId,
            authOToken: res?.data?.data?.authOToken,
          }));
          setRecordId(res?.data?.data?._id);
          setIsSlackConnected(true);
          setDisableInput(true);
        })
        .catch((error) => {
          // message.error(error?.response?.data?.message);
        });
    } catch (error: any) {
      // message.error(error?.response?.data?.message);
    }
  };

  // useEffect to check if slack is connected or  not
  useEffect(() => {
    getSlackData();
  }, []);

  return (
    <>
      <div className='slack-modal-container'>
        <Modal
          title='Slack Integration'
          centered
          open={isSlackModalOpen}
          onOk={() => setIsSlackModalOpen(false)}
          onCancel={() => setIsSlackModalOpen(false)}
          className='slack-modal'
          footer={
            isSlackConnected
              ? [
                  <Button
                    key='submit'
                    type='primary'
                    loading={loading}
                    onClick={handleDelete}
                    className='delete-btn'
                  >
                    Delete
                  </Button>,
                ]
              : [
                  <Button
                    key='submit'
                    type='primary'
                    loading={loading}
                    onClick={handleOk}
                    className='save-btn'
                  >
                    Connect
                  </Button>,
                ]
          }
        >
          <div className='slack-user-data'>
            <label htmlFor='' className='slack-user-label'>
              App Id
            </label>
            <input
              type='text'
              className='slack-user-input'
              onChange={(e) => {
                setSlackData((slackData) => ({
                  ...slackData,
                  appId: e.target.value,
                }));
                setError('');
              }}
              disabled={disableInput}
              value={slackData?.appId || ''}
            />
          </div>
          <div className='slack-user-data'>
            <label htmlFor='' className='slack-user-label'>
              Auth Token
            </label>
            <input
              type='text'
              className='slack-user-input'
              onChange={(e) => {
                setSlackData((slackData) => ({
                  ...slackData,
                  authOToken: e.target.value,
                }));

                setError('');
              }}
              disabled={disableInput}
              value={slackData?.authOToken || ''}
            ></input>
          </div>
          {error && <p className='input-error'>{error}</p>}
        </Modal>
      </div>
    </>
  );
}

export default SlackModal;
