import React from 'react';
import './telegram-guide.scss';
import telegramImage from '../../../../../../public/create-chatbot-svgs/telegram.png';
import Image from 'next/image';

function Page() {
  return (
    <div className='telegram-guide-container'>
      <h1 className='telegram-title'>Telegram Integration Guide</h1>
      <div className='telegram-steps'>
        <p className='telegram-step'>1. Search BotFather in your Telegram app</p>
        <p className='telegram-step'>2. Type <span>/newbot</span></p>
        <p className='telegram-step'>3. Choose name for your bot</p>
        <p className='telegram-step'>4. Choose username for your bot</p>
        <p className='telegram-step'>5. Now you will receive token</p>
        <p className='telegram-step'>6. Copy token and paste in our lucifer.AI telegram modal and <span>click</span> connect</p>
      </div>
      <Image className='telegram-guide-img' src={telegramImage} alt='telegram-image'/>
    </div>
  )
}

export default Page