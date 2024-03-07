import React, { useEffect, useState } from 'react';
import { Button, Modal, message } from 'antd';
import './slack-modal.scss';
import axios from 'axios';

function SlackModal({
  isSlackModalOpen,
  setIsSlackModalOpen,
  userId,
  chatbotId,
}: any) {
  const [loading, setLoading] = useState(false);
  const [slackData, setSlackData] = useState({
    appId: '',
    authToken: '',
  });
  const [error, setError] = useState('');

  console.log('chabtotiddidid', chatbotId);

  function handleOk() {
    if (!slackData.appId.trim() || !slackData.authToken.trim()) {
      setError('Please fill in all fields');
      return;
    }
    const body = {
      ...slackData,
      userId: userId,
      chatbotId: chatbotId,
    };

    try {
      axios
        .post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/slack-bot-integration/api
        `,
          body
        )
        .then((res) => {
          message.success('Success');
        })
        .catch((error) => {
          message.error(error);
        });
    } catch (error: any) {
      message.error(error);
    }
  }

  useEffect(() => {
    try {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/slack-bot-integration/api
        `
        )
        .then((res) => {})
        .catch((error) => {
          message.error(error);
        });
    } catch (error) {}
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
          footer={[
            <Button
              key='submit'
              type='primary'
              loading={loading}
              onClick={handleOk}
            >
              Connect
            </Button>,
          ]}
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
                  authToken: e.target.value,
                }));

                setError('');
              }}
              value={slackData?.authToken || ''}
            ></input>
          </div>
          {error && <p className='input-error'>{error}</p>}
        </Modal>
      </div>
    </>
  );
}

export default SlackModal;
