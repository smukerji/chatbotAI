import { Modal, message } from 'antd'
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react'

function TelegramModal({ setIsTelegramModalOpen }:any) {


  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

    const[telegramToken,setTelegramToken]=useState<any>()
   const[error,setError]=useState<any>({
    telegramToken:null
   })
  
    const handleOk = () => {
        setIsTelegramModalOpen(false);
      };
      const handleCancel=()=>{
        setIsTelegramModalOpen(false)
      }

      const inputChangeHandler=(e:any)=>{
        setTelegramToken(e.target.value)
      }


const setTelegramData= async ()=>{
    try {
        const url=`${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api`
        const response = await fetch(url,{
            headers: {
                cache: "no-store",
              },
            method:'POST',
            next: { revalidate: 0 },
            body:JSON.stringify({
                chatbotId:chatbot.id,
                telegramToken:telegramToken,
                // userId:'wdw'
            })
        })
        const resp = await response.json()
        if(resp.linked){
            message.error(resp?.message)
        }
    } catch (error) {
        console.log("error setting telegram data",error)
    }
}



      //This function is called when user clicks on connect btn of telegram
      const onConnect= async ()=>{
         
        try {
            let url = `https://api.telegram.org/bot${telegramToken}/setWebhook?url=${process.env.NEXT_PUBLIC_NGROCKURL}/chatbot/dashboard/telegram/webhookTelegram/api?token=${telegramToken}`
            const response = await fetch(url,{
                headers: {
                    cache: "no-store",
                  },
                method:'GET',
                next: { revalidate: 0 },

            })
            const resp = await response.json();
           if(resp.ok){
               setTelegramData()
               message.success('success')
               setIsTelegramModalOpen(false)
           }
           else{
            message.error('please check token and connect again')
           }
        } catch (error) {
            console.log('error from telegram',error)
        }


      }
    
     console.log(telegramToken)
  return (
    <div className='telegram-container'>
          <Modal  open={true} onOk={handleOk} footer={false} onCancel={handleCancel} className='telegram-modal'>
            <div className='telegram-heading'>Telegram Integration</div>
            <div className='telegram-token-container'>

            <label className='telegram-label'>Enter Telegram Token</label>
            <input type="text" className='telegram-input' placeholder='Enter your token from telegram ' onChange={inputChangeHandler}/>
            <p className='telegram-error'>Enter </p>
            </div>
            <button className='telegram-button' onClick={onConnect}>connect</button>
      </Modal>
    </div>
  )
}

export default TelegramModal