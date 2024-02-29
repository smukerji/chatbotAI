'use client';

import React, { useState, useEffect, useDebugValue, useContext } from 'react';
import axios from 'axios';
import './billing.scss';
import Image from 'next/image';
import { useCookies } from 'react-cookie';
import { useSession } from 'next-auth/react';
// import { redirect } from "next/navigation";
import { getDate } from '@/app/_helpers/client/getTime';
import { Table, Modal, message } from 'antd';
import { redirect, useRouter } from 'next/navigation';
import { UserDetailsContext } from '@/app/_helpers/client/Context/UserDetailsContext';

export default function BillingAndUsage() {
  const [cookies, setCookie] = useCookies(['userId']);
  const { status } = useSession();
  const [plan, setPlan] = useState('');
  const [msg, setMsg] = useState(0);
  const [chat, setChat] = useState(0);
  const [date, setDate] = useState<any>();
  const [duration, setDuration] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [disable, setDisable] = useState(false);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  console.log(userDetails)
  // const [columns, setColumns] = useState([])

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api`,
      { u_id: cookies.userId }
    );
    if (response.data.status == 1) {
      message.success(response.data.msg);
    } else {
      message.error(response.data.msg);
    }
    setDisable(true);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: 'PaymentId',
      dataIndex: 'paymentId',
      key: 'paymentId',
      
    },
    {
      title: 'Amount',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  const explorePlan = async () => {
    router.push(`${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`);
  };

  const myFunction = async () => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api`,
      { u_id: cookies.userId }
    );
    setChat(response?.data?.chatbot);
    setMsg(response?.data?.message);
    setPlan(response?.data?.plan);
    const newDate = new Date(response?.data?.nextRenewal)
    const options : any = { year: 'numeric', month: 'short', day: '2-digit' };
    const formattedDate : any = newDate.toLocaleDateString('en-US', options);
    setDate(formattedDate);
    setDataSource(response?.data?.paymentDetails);
    if (response?.data?.nextPlan == '') {
      setDisable(true);
    }

    if (!response?.data?.duration) {
      setDuration('7 days free trial');
    } else if (response?.data?.duration == 'month') {
      setDuration('Billed monthly');
    } else {
      setDuration('Billed yearly');
    }
  };
  useEffect(() => {
    myFunction();
  }, []);

  if (status === 'authenticated' || cookies?.userId) {
    return (
      <>
        <Modal
          title='Cancel my plan'
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          cancelText='Keep Plan'
          okText='Cancel Plan'
          closeIcon={null}
        >
          <p>Are you sure to cancel the plan</p>
        </Modal>
        <div className='billing-main'>
          <div className='billing-head'>Billing & Usage</div>
          <div className='message-count'>
            <div className='message-head'></div>
          </div>
          <div className='plan-head'>My Plan</div>
          <div className='plan-details'>
            <div className='name-features'>
              <div className='plan-name-container'>
                <span className='plan-name'>{plan}</span>
                <div className='plan-duration'>
                  <span className='plan-duration-text'>{duration}</span>
                </div>
              </div>
              <div className='plan-feature'>
                <div className='plan-message'>{userDetails?.plan?.messageLimit} messages</div>
                <div className='plan-chatbot'>{userDetails?.plan?.numberOfChatbot} chatbots</div>
                <div className='next-renewal-date'>
                  <div className='next-renewal-date-text'>
                    Next renewal date
                  </div>
                  <div className='next-renewal-date-date'>{date}</div>
                </div>
              </div>
            </div>
          </div>
          <div className='btn-class'>
            <button className='btn-upgrade' onClick={explorePlan}>
              <span className='btn-text'>Explore Plans</span>
            </button>
            <button
              className='btn-cancel-plan'
              onClick={showModal}
              disabled={disable}
            >
              <span className='btn-text-cancel-plan'>Cancel My Plan</span>
            </button>
          </div>
          <div className='manage-plan'>Payment history</div>
          {/* <div className="manage-plan-text">
          Manage your payment methods or cancel your plan by clicking on the
          link below
        </div>
        <button className="btn-manage-billing">
          <span className="btn-text">Manage Billing</span>
        </button> */}
        </div>
        <Table
          className='payment-table'
          dataSource={dataSource}
          columns={columns}
          scroll={{
            x: 600,
          }}
        />
        ;
      </>
    );
  } else if (status === 'unauthenticated') {
    redirect('/account/login');
  }
}
