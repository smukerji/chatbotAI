import React, { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import infoImage from '../../../../../../public/voiceBot/SVG/info-circle.svg';
import { message } from 'antd';
import { CreateAssistantFlowContext } from '@/app/_helpers/client/Context/CreateAssistantFlowContext';

function ChooseIndustryExpert() {
	const [industryTypes, setIndustryTypes] = useState([]);

	/// get the context data
	const createAssistantFlowContext: any = useContext(
		CreateAssistantFlowContext
	);
	const createAssistantFlowContextDetails =
		createAssistantFlowContext.createAssistantFlowInfo;

	/// get the industry list from api
	async function getIndustryList() {
		const res = await fetch(
			`/create-first-assistant/industry-types/api`
		);
		/// error handling
		if (!res.ok) {
			message.error('Failed to fetch industry types');
			return;
		}
		const response = await res.json();

		setIndustryTypes(response.industryTypes);
	}

	useEffect(() => {
		getIndustryList();
	}, []);

	/// funciton to check if the industry expert should be selected based on the assistant type or not
	function checkIfEnable(industryType?: string) {
		if (
			createAssistantFlowContextDetails.assistantType
				?.abbreviation == 'ecommerce-agent' &&
			industryType == 'shopify'
		) {
			/// if the assistant type is ecommerce-agent and industry type is shopify then only enable the shopify expert
			return false;
		} else if (
			createAssistantFlowContextDetails.assistantType
				?.abbreviation == 'research-agent' &&
			industryType == 'web-expert'
		) {
			/// if the assistant type is re-agent i.e. that is real estate agent then only enable the real estate expert
			return false;
		} else if (
			/// if the assistant type is re-agent i.e. that is real estate agent then only enable the real estate expert
			createAssistantFlowContextDetails.assistantType
				?.abbreviation == 're-agent' &&
			industryType == 'real-estate'
		) {
			return false;
		} else if (
			createAssistantFlowContextDetails.assistantType
				?.abbreviation !== 'ecommerce-agent' &&
			industryType != 'shopify' &&
			createAssistantFlowContextDetails.assistantType
				?.abbreviation !== 're-agent'
		) {
			/// if the assistant type is not ecommerce-agent and industry type is not shopify then enable all the industry experts except shopify
			return false;
		} else {
			return true;
		}
	}

	return (
		<div>
			<div className='title'>
				<h1>Choose your industry expert</h1>
				<span>
					Choose your specialized AI expert for tasks like
					translation, diagnostics, finance, or customer
					service needs.
				</span>
			</div>

			<div className='assistant-wrapper'>
				{industryTypes?.length > 0 &&
					industryTypes.map(
						(assistant: any, index: number) => {
							return (
								<button
									disabled={checkIfEnable(
										assistant?.abbreviation
									)}
									className={
										createAssistantFlowContextDetails
											.industryExpertType
											.abbreviation ===
										assistant.abbreviation
											? 'assistant-card selected-assistant'
											: `assistant-card`
									}
									key={assistant._id}
									onClick={() => {
										createAssistantFlowContext.handleChange(
											'industryExpertType'
										)(assistant);
									}}
								>
									<div className='card-image'>
										<Image
											src={
												assistant.imageUrl
											}
											alt=''
											height={100}
											width={100}
											unoptimized
										></Image>
									</div>
									<div className='header-information'>
										<div className='header_container'>
											<h2 className='card_header'>
												{
													assistant.title
												}
											</h2>
											<div className='image-info'>
												<Image
													src={
														infoImage
													}
													alt=''
													height={
														100
													}
													width={
														100
													}
												></Image>
											</div>
										</div>

										<h3 className='card_sub-header'>
											{
												assistant.description
											}
										</h3>
									</div>
								</button>
							);
						}
					)}
			</div>
		</div>
	);
}

export default ChooseIndustryExpert;
