"use client";
import "./create-first-assistant.scss";
import { Button, Input, message, Steps, Modal } from "antd";
import editIcon from "../../../../public/svgs/edit-2.svg";
import Image from "next/image";

import img from '../../../../public/voiceBot/Image (4).png';
import infoImage from '../../../../public/voiceBot/SVG/info-circle.svg';
import customTemplate from '../../../../public/voiceBot/SVG/profile-circle.svg';
import galaryImg from '../../../../public/voiceBot/SVG/gallery-add.svg';
import leftArrow from '../../../../public/voiceBot/SVG/arrow-left.svg';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useCookies } from 'react-cookie';

import { useState, useContext, useEffect, useLayoutEffect } from 'react';

// import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"/
import { CreateVoiceBotContext } from '../../_helpers/client/Context/VoiceBotContextApi';
import SelectAssistantType from '../create-first-assistant/_components/SelectAssistantType/SelectAssistantType';
import PricingWrapperNew from '../home/pricing/_components/PricingWrapperNew';
import {
	AssistantFlowStep,
	CreateAssistantFlowContext,
	SelectedAssistantType,
} from '@/app/_helpers/client/Context/CreateAssistantFlowContext';
import ChooseAssistant from '../create-first-assistant/_components/ChooseAssistant/ChooseAssistant';
import ChooseIndustryExpert from '../create-first-assistant/_components/ChooseIndustryExpert/ChooseIndustryExpert';
import Home from '../home/page';
import { CreateBotContext } from '@/app/_helpers/client/Context/CreateBotContext';
import ShopifySecretModal from '../create-first-assistant/_components/Modals/ShopifySecretModal';
import axios from 'axios';
import ChooseVoiceAssistantType from './_components/ChooseVoiceAssistantType/ChooseVoiceAssistantType';
import ChooseVoiceAssistantExpert from './_components/ChooseVoiceAssistantExpert/ChooseVoiceAssistantExpert';
// import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import CreateAssitstantContainerItems from './_components/CreateAssitstantContainerItems/CreateAssitstantContainerItems';
import { UserDetailsContext } from '@/app/_helpers/client/Context/UserDetailsContext';
import { assertMessageExist } from "./assertionFunction/notification";

export default function FirstAssistant() {
	const [cookies, setCookie] = useCookies(['userId']);

	const router = useRouter();

	/// get the context data
	const createAssistantFlowContext: any = useContext(
		CreateAssistantFlowContext
	);
	const createAssistantFlowContextDetails =
		createAssistantFlowContext.createAssistantFlowInfo;

	const userDetailContext: any = useContext(UserDetailsContext);
	const userDetails = userDetailContext?.userDetails;

	const botContext: any = useContext(CreateBotContext);

	const voiceBotContextData: any = useContext(CreateVoiceBotContext);
	const voiceBotContext = voiceBotContextData.state;

	const botDetails = botContext?.createBotInfo;

	/// fetch the params
	const params: any = useSearchParams();
	const source = decodeURIComponent(params.get("source"));
	const voicebotpurchase = decodeURIComponent(params.get("voicebotPurchase"));

	const [isVoiceModalVisible, setVoiceModalVisible] = useState(false);



	const [assistantData, setAssistantData] = useState<any>([]);

	/// data sources to train
	const [qaData, setQaData]: any = useState();
	const [textData, setTextData]: any = useState();
	const [fileData, setFileData]: any = useState();
	const [crawlData, setCrawlData]: any = useState();
	const [assistantList, setAssistantList] = useState<any>([]);
	const [industryExpertList, setIndustryExpertList] = useState<any>([]);
	const [selectedAssistantIndex, setSelectedAssistantIndex] =
		useState<number>(-1);
	const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
	const [defaultAssistant, setDefaultAssistant] = useState<any>(null);
	const [isBlankTemplateSelected, setIsBlankTemplateSelected] = useState<boolean>(false);
	const [selecteExpertIndex, setSelectedExpertIndex] = useState<number>(-1);
	const [selectedIndustryExpert, setSelectedIndustryExpert] =
		useState<any>(null);

	const [acknowledgedData, setAcknowledgedData] = useState<any>({});
	const [assistantImagePath, setassistantImagePath] = useState<string>('');

	/// plan state to check if user purchased plan while onboarding
	const [plan, setPlan]: any = useState();
	const [voicePlan, setVoicePlan] = useState<number>(0);
	const { status } = useSession();

	const [inputValidationMessage, setinputValidationMessage] =
		useState<string>('');

	const [isInputVisible, setIsInputVisible] = useState<boolean>(false);

	const handleInputBlur = () => {
		setIsInputVisible(false);
	};

	/// modal state handler
	const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

	const assistantNameChangeHandler = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const enteredValue = e.target.value.trim();

		if (inputValidationMessage != '') setinputValidationMessage('');

		createAssistantFlowContext?.handleChange('assistantName')(
			enteredValue
		);

		// botContext?.handleChange("chatbotName")(enteredValue);
	};


	const continuesChangeHandler = async () => {
		// if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
		/// change the steps according to the flow
		if (createAssistantFlowContextDetails?.currentAssistantFlowStep === AssistantFlowStep.CHOOSE_BOT_TYPE) {
			/// validation for assistant name & creation flow
			if (createAssistantFlowContextDetails?.assistantName.trim().length === 0) {
				setinputValidationMessage('Please, Provide Assistant Name!');
				return;
			}
			if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.NULL) {
				message.warning('Please select the type of assistant!');
				return;
			}
			/// check for the pricing plan only if user is first time user
			if (plan?.price && createAssistantFlowContextDetails.creationFlow === SelectedAssistantType.CHAT) {
				createAssistantFlowContext?.handleChange('currentAssistantFlowStep')(AssistantFlowStep.CHOOSE_ASSISTANT_TYPE);
				return;
			}
			await giveFreeVoicebotCreditToUser();
			if (voicePlan > 0 && createAssistantFlowContextDetails.creationFlow === SelectedAssistantType.VOICE) {
				createAssistantFlowContext?.handleChange('currentAssistantFlowStep')(AssistantFlowStep.CHOOSE_ASSISTANT_TYPE);
				return;
			}

			createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
				AssistantFlowStep.CHOOSE_PLAN
			);
		} else if (createAssistantFlowContextDetails?.currentAssistantFlowStep ===
			AssistantFlowStep.CHOOSE_PLAN) {
			if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
				if (!plan?.price) {
					message.warning("Please select a plan first!");
					return;
				}
				createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
					AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
				);
			}
			else if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE) {
				//get the voiceplan from the api and if not added don't go further
				await giveFreeVoicebotCreditToUser();
				if (voicePlan === 0) {
					message.warning("Please add the voicebot credit first!");
					return;
				}
				createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
					AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
				);
			}
			else {
				createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
					AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
				);
			}
		} else if (
			createAssistantFlowContextDetails?.currentAssistantFlowStep ===
			AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
		) {
			/// validation for assistant type
			if (!createAssistantFlowContextDetails?.assistantType?.abbreviation) {
				message.warning("Please select an assistant first!");
				return;
			}

			/// if "Default" (Blank Template) is selected and it's a VOICE flow, skip industry expert step
			if (
				(isBlankTemplateSelected ||
					selectedAssistant?.dispcrtion === "Default" ||
					createAssistantFlowContextDetails?.assistantType?.description === "Default") &&
				createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE
			) {
				const assistantTemplateIDs = [
					selectedAssistant?._id,
				];

				let assistantName =
					createAssistantFlowContextDetails?.assistantName;

				if (acknowledgedData?.isAcknowledged) {
					//update the data
					try {
						const assistantUpdateResponse = await fetch(
							`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
							{
								method: 'PUT',
								body: JSON.stringify({
									assistantName: assistantName,
									assistantTemplateIDs: assistantTemplateIDs,
									imageUrl: assistantImagePath,
									recordId: acknowledgedData?.insertedId,
								}),
							}
						);

						const assistantUpdateResponseParse =
							await assistantUpdateResponse.json();

						router.push(`/voicebot/dashboard?voicBotName=${assistantName}&firstInit=true`);
					} catch (error: any) {
						console.log(error);
						message.error(error.message);
					}
				} else {
					//create the data
					try {
						const assistantCreateResponse = await fetch(
							`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
							{
								method: 'POST',
								body: JSON.stringify({
									assistantName: assistantName,
									assistantTemplateIDs: assistantTemplateIDs,
									imageUrl: assistantImagePath,
									userId: cookies.userId,
								}),
							}
						);

						const assistantCreateResponseParse =
							await assistantCreateResponse.json();

						voiceBotContextData.setAssistantMongoId(
							assistantCreateResponseParse?.result?.insertedId
						);
						let assistantData = assistantCreateResponseParse?.record;
						voiceBotContextData.setAssistantInfo(assistantData);
						router.push(`/voicebot/dashboard?voicBotName=${assistantName}&firstInit=true`);
					} catch (error: any) {
						console.log(error);
						message.error(error.message);
					}
				}
				return;
			}

			createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
				AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT
			);
		} else if (
			createAssistantFlowContextDetails?.currentAssistantFlowStep ===
			AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT
		) {
			/// validation for industry expert
			if (
				!createAssistantFlowContextDetails?.industryExpertType?.abbreviation
			) {
				message.warning("Please select an Industry Expert first!");
				return;
			}

			if (
				createAssistantFlowContextDetails?.creationFlow ===
				SelectedAssistantType.VOICE
			) {
				const assistantTemplateIDs = [
					selectedAssistant?._id,
					selectedIndustryExpert?._id,
				];

				let assistantName =
					createAssistantFlowContextDetails?.assistantName;

				if (acknowledgedData?.isAcknowledged) {
					//update the data

					try {
						const assistantUpdateResponse = await fetch(
							`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
							{
								method: 'PUT',
								body: JSON.stringify({
									assistantName:
										assistantName,
									assistantTemplateIDs:
										assistantTemplateIDs,
									imageUrl: assistantImagePath,
									recordId: acknowledgedData?.insertedId,
								}),
							}
						);

						const assistantUpdateResponseParse =
							await assistantUpdateResponse.json();

						router.push(`/voicebot/dashboard?voicBotName=${assistantName}&firstInit=true`);
					} catch (error: any) {
						console.log(error);
						message.error(error.message);
					}
				} else {
					//create the data

					try {
						const assistantCreateResponse = await fetch(
							`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
							{
								method: 'POST',
								body: JSON.stringify({
									assistantName:
										assistantName,
									assistantTemplateIDs:
										assistantTemplateIDs,
									imageUrl: assistantImagePath,
									userId: cookies.userId,
								}),
							}
						);

						const assistantCreateResponseParse =
							await assistantCreateResponse.json();

						voiceBotContextData.setAssistantMongoId(
							assistantCreateResponseParse?.result
								?.insertedId
						);
						let assistantData =
							assistantCreateResponseParse?.record;
						voiceBotContextData.setAssistantInfo(
							assistantData
						);
						router.push(`/voicebot/dashboard?voicBotName=${assistantName}&firstInit=true`);
					} catch (error: any) {
						console.log(error);
						message.error(error.message);
					}
				}
			} else {
				/// if shopify is selected open the modal
				if (
					createAssistantFlowContextDetails
						?.industryExpertType?.abbreviation ===
					'shopify'
				) {
					setIsModalVisible(true);
				}
				createAssistantFlowContext?.handleChange(
					'currentAssistantFlowStep'
				)(AssistantFlowStep.ADD_DATA_SOURCES);
			}
		}

		// }
		// else if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE){

		// }
	};



	const checkPlan = async () => {
		try {
			//ANCHOR - Checking existing plan details
			const checkPlan = await axios.put(
				`${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/check-plan`,
				{
					u_id: cookies?.userId,
				}
			);

			const planDetails = checkPlan.data;

			/// check if the source is not the chatbot and the assistant flow is selected and the plan is purchased then move the step to choose assistant type
			if (
				planDetails?.price &&
				source !== 'chatbot' &&
				createAssistantFlowContextDetails?.creationFlow !==
				SelectedAssistantType.NULL
			) {
				createAssistantFlowContext?.handleChange(
					'currentAssistantFlowStep'
				)(AssistantFlowStep.CHOOSE_ASSISTANT_TYPE);
			}

			setPlan(planDetails);
		} catch (error) {
			console.log('error', error);
		}
	};

	/// get the user and plan details

	const fetchData = async () => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${cookies?.userId}`,
			{
				method: 'GET',
				next: { revalidate: 0 },
			}
		);

		const userDetails = await response.json();
		const date2: any = new Date(userDetails?.planExpiry);
		const date1: any = new Date(); // Current date

		// Calculate the difference in milliseconds
		const differenceMs = date2 - date1;
		const differenceDays = Math.round(
			differenceMs / (1000 * 60 * 60 * 24)
		);
		/// set the expiry
		userDetailContext?.handleChange('planExpiry')(differenceDays);
		userDetailContext?.handleChange('totalMessageCount')(
			userDetails?.userDetails?.totalMessageCount
		);
		/// set the username and email
		userDetailContext?.handleChange('firstName')(
			userDetails?.firstName
		);
		userDetailContext?.handleChange('lastName')(userDetails?.lastName);
		userDetailContext?.handleChange('fullName')(userDetails?.fullName);
		userDetailContext?.handleChange('email')(userDetails?.email);

		userDetailContext?.handleChange('plan')(userDetails?.plan);
		userDetailContext?.handleChange('noOfChatbotsUserCreated')(
			userDetails?.noOfChatbotsUserCreated
		);
		const percent =
			(userDetails?.userDetails?.totalMessageCount /
				userDetails?.plan?.messageLimit) *
			100;
		/// store the percentage of message sent by user
		userDetailContext?.handleChange('percent')(percent);
	};

	useEffect(() => {
		giveFreeVoicebotCreditToUser();
		getVoiceAssistantTemplateData();
		checkPlan();
		fetchData();
	}, []);

	useEffect(() => {
		if (plan == undefined) {
			checkPlan();
		}
	}, [createAssistantFlowContextDetails?.currentAssistantFlowStep]);

	// Function to check if a file is an image
	const isImageFile = (file: any) => {
		const acceptedImageTypes = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/svg+xml',
		];
		return acceptedImageTypes.includes(file.type);
	};

	async function getVoiceAssistantTemplateData() {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/template`,
				{
					method: 'GET',
				}
			);
			const data = await res.json();

			// Find the "Default" assistant and store it separately
			const defaultAsst = data?.assistantTemplates.find(
				(assistance: any) =>
					assistance?.industryType === 'Assistant' && assistance?.dispcrtion === 'Default'
			);

			// Filter out the "Default" from the list (Blank Template will represent it)
			let assistantDataList = data?.assistantTemplates.filter(
				(assistance: any) =>
					assistance?.industryType === 'Assistant' && assistance?.dispcrtion !== 'Default'
			);
			let industryExpertDataList = data?.assistantTemplates.filter(
				(assistance: any) =>
					assistance?.industryType === 'Expert'
			);

			setAssistantList(assistantDataList);
			setIndustryExpertList(industryExpertDataList);

			// Store default assistant for Blank Template
			if (defaultAsst) {
				setDefaultAssistant(defaultAsst);
			}
		} catch (error: any) {
			console.log(error);
		}
	}

	async function giveFreeVoicebotCreditToUser() {
		try {
			console.log("user id ", cookies.userId);

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/assistant?userId=${cookies.userId}`,
				{
					method: "POST",
				}
			);

			const data = await res.json();
			setVoicePlan(data?.userCredits as number || 0);

			assertMessageExist(data?.message, data?.message);


		} catch (error: any) {
			console.log(error);
		}
	}

	const selectedAssistantChangeHandler = (
		choosenAssistant: any,
		index: number
	) => {
		setSelectedAssistantIndex(index);
		setIsBlankTemplateSelected(false);

		setSelectedAssistant(choosenAssistant);
		let assistantTypeObj = {
			title: choosenAssistant?.assistantType,
			description: choosenAssistant?.dispcrtion,
			imageUrl: choosenAssistant?.imageUrl,
			abbreviation: choosenAssistant?._id,
		};
		createAssistantFlowContext?.handleChange('assistantType')(
			assistantTypeObj
		);
	};

	const blankTemplateClickHandler = () => {
		setSelectedAssistantIndex(-1);
		setIsBlankTemplateSelected(true);

		if (defaultAssistant) {
			setSelectedAssistant(defaultAssistant);
			let assistantTypeObj = {
				title: defaultAssistant?.assistantType,
				description: defaultAssistant?.dispcrtion,
				imageUrl: defaultAssistant?.imageUrl || '',
				abbreviation: defaultAssistant?._id,
			};
			createAssistantFlowContext?.handleChange('assistantType')(
				assistantTypeObj
			);
		}
	};

	const selectedExpertChangeHandler = (
		choosenExpert: any,
		index: number
	) => {
		setSelectedExpertIndex(index);
		setSelectedIndustryExpert(choosenExpert);

		let industryExpertTypeObj = {
			title: choosenExpert?.assistantType,
			description: choosenExpert?.dispcrtion,
			imageUrl: choosenExpert?.imageUrl,
			abbreviation: choosenExpert?._id,
		};
		createAssistantFlowContext?.handleChange('industryExpertType')(
			industryExpertTypeObj
		);
	};

	const previousChangeHandler = () => {
		// if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
		/// adjust the steps according to the flow in reverse order
		if (createAssistantFlowContextDetails?.currentAssistantFlowStep === AssistantFlowStep.CHOOSE_PLAN) {
			createAssistantFlowContext?.handleChange(
				'currentAssistantFlowStep'
			)(AssistantFlowStep.CHOOSE_BOT_TYPE);
		} else if (createAssistantFlowContextDetails?.currentAssistantFlowStep === AssistantFlowStep.CHOOSE_ASSISTANT_TYPE) {
			/// if user is not first time user then skip the plan step
			if (plan?.price) {
				createAssistantFlowContext?.handleChange(
					'currentAssistantFlowStep'
				)(AssistantFlowStep.CHOOSE_BOT_TYPE);
				return;
			}
			createAssistantFlowContext?.handleChange('currentAssistantFlowStep')(AssistantFlowStep.CHOOSE_PLAN);
		} else if (createAssistantFlowContextDetails?.currentAssistantFlowStep === AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT) {
			/// empty the industry expert type
			// createAssistantFlowContext?.handleChange(
			// 	'industryExpertType'
			// )({
			// 	title: '',
			// 	description: '',
			// 	imageUrl: '',
			// 	abbreviation: '',
			// });
			/// empty integration also if user hits previous button
			createAssistantFlowContext?.handleChange('integration')({});
			createAssistantFlowContext?.handleChange(
				'integrationSecretVerified'
			)(false);
			createAssistantFlowContext?.handleChange(
				'currentAssistantFlowStep'
			)(AssistantFlowStep.CHOOSE_ASSISTANT_TYPE);
		} else if (
			createAssistantFlowContextDetails?.currentAssistantFlowStep ===
			AssistantFlowStep.ADD_DATA_SOURCES
		) {
			createAssistantFlowContext?.handleChange(
				'currentAssistantFlowStep'
			)(AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT);
		}
		// }
		// else if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE){

		// }

		// const previousAssistantFlowStep =
		//   createAssistantFlowContextDetails?.currentAssistantFlowStep - 1;
		// createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
		//   previousAssistantFlowStep
		// );
	};

	const imageHandler = async (e: any) => {
		if (
			createAssistantFlowContextDetails?.creationFlow ===
			SelectedAssistantType.NULL
		) {
			message.info('Please select the type of assistant first');
			return;
		}

		if (
			createAssistantFlowContextDetails?.creationFlow ===
			SelectedAssistantType.CHAT
		) {
			message.info('Image upload is not available for chatbot');
			return;
		}

		if (
			createAssistantFlowContextDetails?.assistantName.trim()
				.length === 0
		) {
			message.info('Please provide assistant name first');
			return;
		}

		const selectedFile = e.target.files[0];

		// Check if a file is selected and it's an image
		if (selectedFile && isImageFile(selectedFile)) {
			/// upload the image file to vercel
			try {
				// setIsLoading(!isLoading);
				/// delete any existing URL if any
				if (acknowledgedData?.isAcknowledged) {
					fetch(
						`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/delete-img`,
						{
							method: 'POST',
							body: JSON.stringify({
								url: assistantImagePath,
							}),
						}
					);
				}

				const res = await fetch(
					`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/upload-img?filename=${selectedFile.name}`,
					{
						method: 'POST',
						body: selectedFile,
					}
				);

				if (!res.ok) {
					throw await res.json();
				}
				const data = await res.json();
				// setIconImage(data?.uploadUrl);

				const assistantTemplateIDs = [
					selectedAssistant?._id,
					selectedIndustryExpert?._id,
				];
				const imagePath = data?.uploadUrl;
				setassistantImagePath(imagePath);
				// const voiceAssistantName = assistantName;
				const voiceAssistantName =
					createAssistantFlowContextDetails?.assistantName;
				if (acknowledgedData?.isAcknowledged) {
					const assistantUpdateResponse = await fetch(
						`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
						{
							method: 'PUT',
							body: JSON.stringify({
								assistantName:
									voiceAssistantName,
								assistantTemplateIDs:
									assistantTemplateIDs,
								imageUrl: imagePath,
								recordId: acknowledgedData?.insertedId,
							}),
						}
					);

					const assistantUpdateResponseParse =
						await assistantUpdateResponse.json();
					setAcknowledgedData({
						isAcknowledged:
							assistantUpdateResponseParse?.result
								?.acknowledged,
						insertedId: assistantUpdateResponseParse
							?.result?.upsertedId
							? assistantUpdateResponseParse?.result
								?.upsertedId
							: acknowledgedData?.insertedId,
					});
				} else {
					const assistantCreateResponse = await fetch(
						`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
						{
							method: 'POST',
							body: JSON.stringify({
								assistantName:
									voiceAssistantName,
								assistantTemplateIDs:
									assistantTemplateIDs,
								imageUrl: imagePath,
								userId: cookies.userId,
							}),
						}
					);

					const assistantCreateResponseParse =
						await assistantCreateResponse.json();

					voiceBotContextData.setAssistantMongoId(
						assistantCreateResponseParse?.result
							?.insertedId
					);
					let assistantData =
						assistantCreateResponseParse?.record;
					voiceBotContextData.setAssistantInfo(
						assistantData
					);
					setAcknowledgedData({
						isAcknowledged:
							assistantCreateResponseParse?.result
								?.acknowledged,
						insertedId:
							assistantCreateResponseParse?.result
								?.insertedId,
					});
				}

				//

				//add the entry to the database
			} catch (error: any) {
				message.error(error.message);
				return;
			} finally {
				// setIsLoading((prev) => !prev);
			}

			// setFileName(selectedFile.name);
		} else {
			// Display an error message or handle the invalid file selection as needed
			message.error('Invalid file format.');
			return;
		}
	};

	if (status === 'authenticated' || cookies?.userId) {
		return (
			<div className='create-assistant-container'>
				{window.innerWidth >= 768 && (
					<>
						{/*------------------------------------------stepper----------------------------------------------*/}
						<div className='stepper'>
							<div className='title-container'>
								<h2 className='title'>
									Welcome to Torri AI
								</h2>
								<span className='sub-title'>
									Let&apos;s create your own
									Bot just in 5 steps
								</span>
							</div>
							<div className='voicebot-avatar'>
								<div
									className='voicebot-avatar-img'
									style={{
										backgroundImage: `url(${assistantImagePath})`,
									}}
								>
									<input
										type='file'
										id='profileImageId'
										style={{
											display: 'none',
										}}
										accept='image/*'
										onChange={
											imageHandler
										}
									/>
									<label
										htmlFor='profileImageId'
										className='file-label'
									>
										<Image
											alt=''
											src={
												galaryImg
											}
											className='galary_image'
										></Image>
									</label>
								</div>
								<div className='voicebot-avatar-img__info'>
									{/* <div className="assistant-input-wrapper"> */}
									<div>
										<div
											style={{
												display: 'flex',
												gap: '5px',
											}}
										>
											<Input
												// className={inputValidationMessage ? "input-field invalid-input" : "input-field"}
												className={
													inputValidationMessage
														? 'assi-input-field invalid-input'
														: 'assi-input-field'
												}
												placeholder='Assistant Name'
												onChange={
													assistantNameChangeHandler
												}
												// onBlur={handleInputBlur}
												id='assistantNameInput'
												value={
													createAssistantFlowContextDetails?.assistantName
												}
												disabled={
													!isInputVisible
												}
											/>

											<span
												style={{
													color: 'red',
													fontSize: '25px',
												}}
											>
												*
											</span>
										</div>
										{inputValidationMessage && (
											<p className='invalidation-message'>
												{
													inputValidationMessage
												}
											</p>
										)}
									</div>

									{/* </div> */}

									<Button
										style={{
											border: "none",
											margin: 0,
											padding: 0,
											background: "transparent",
										}}
										icon={<Image src={editIcon} alt="edit name" />}
										onClick={() => {
											setIsInputVisible(true);
											const inputElement = document.getElementById(
												"assistantNameInput"
											) as HTMLInputElement;
											if (inputElement) {
												inputElement.focus();
											}
										}}
									/>
								</div>

							</div>
							<Steps
								className="stepper-steps"
								direction="vertical"
								size="small"
								current={
									createAssistantFlowContextDetails?.currentAssistantFlowStep
								}
								items={[
									{
										/// if this steps is processed mark status as finsihsed
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_BOT_TYPE
												? "process"
												: "finish",
										title: (
											<div>
												<h3 className="steps-assistant-heading">
													Create your Assistant
												</h3>
											</div>
										),
									},
									// Only include the plan step if the user doesn't have a plan
									...(plan?.price && source == "chatbot"
										? []
										: [
											{
												status:
													createAssistantFlowContextDetails?.currentAssistantFlowStep ===
														AssistantFlowStep.CHOOSE_PLAN
														? ("process" as "process")
														: (plan?.price || createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE)
															? ("finish" as "finish")
															: ("wait" as "wait"),
												title: (
													<div>
														<h3 className="steps-assistant-heading">
															Select plan
														</h3>
													</div>
												),
											},
										]),
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
												? "process"
												: createAssistantFlowContextDetails?.assistantType
													?.abbreviation
													? "finish"
													: "wait",
										title: createAssistantFlowContextDetails?.assistantType
											?.imageUrl ? (
											<div className="selected-assistant">
												<div className="mini-selected-assistant-image">
													<input
														type="file"
														id="profileImageId"
														style={{ display: "none" }}
														accept="image/*"
													// onChange={imageHandler}
													/>
													<label
														htmlFor="profileImageId"
														className="file-label"
													>
														<Image
															alt={
																createAssistantFlowContextDetails?.assistantType
																	?.title
															}
															src={
																createAssistantFlowContextDetails?.assistantType
																	?.imageUrl
															}
															width={100}
															height={100}
														></Image>
													</label>
												</div>
												<div className="selected-assistant-header">
													<h3 className="heading_title">
														{
															createAssistantFlowContextDetails?.assistantType
																?.title
														}
													</h3>
													<h4 className="heading_description">
														{
															createAssistantFlowContextDetails?.assistantType
																?.description
														}
													</h4>
												</div>
											</div>
										) : (
											<div>
												<h3 className="steps-assistant-heading">
													Choose your assistant
												</h3>
											</div>
										),
									},
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT
												? "process"
												: createAssistantFlowContextDetails?.industryExpertType
													?.abbreviation
													? "finish"
													: "wait",
										title: createAssistantFlowContextDetails?.industryExpertType
											?.imageUrl ? (
											<div className="selected-assistant">
												<div className="mini-selected-assistant-image">
													<input
														type="file"
														id="profileImageId"
														style={{ display: "none" }}
														accept="image/*"
													// onChange={imageHandler}
													/>
													<label
														htmlFor="profileImageId"
														className="file-label"
													>
														<Image
															alt={
																createAssistantFlowContextDetails
																	?.industryExpertType?.title
															}
															src={
																createAssistantFlowContextDetails
																	?.industryExpertType?.imageUrl
															}
															width={100}
															height={100}
														></Image>
													</label>
												</div>
												<div className="selected-assistant-header">
													<h3 className="heading_title">
														{
															createAssistantFlowContextDetails
																?.industryExpertType?.title
														}
													</h3>
													<h4 className="heading_description">
														{
															createAssistantFlowContextDetails
																?.industryExpertType?.description
														}
													</h4>
												</div>
											</div>
										) : (
											<div>
												<h3 className="steps-assistant-heading">
													Choose your Industry Expert
												</h3>
											</div>
										),
									},
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.ADD_DATA_SOURCES
												? "process"
												: "wait",
										title: (
											<div>
												<h3 className="steps-assistant-heading">
													Customize more
												</h3>
											</div>
										),
									},
								]}
							/>

							<div className={'navigation-button'}>
								{/* {voiceBotContextData.currentAssistantPage !== 0 && ( */}
								<Button
									className='previous-button'
									onClick={
										previousChangeHandler
									}
									style={{
										visibility:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_BOT_TYPE
												? 'hidden'
												: 'visible',
									}}
								>
									<Image
										className='arrow-left'
										alt='left arrow'
										src={leftArrow}
										width={100}
										height={100}
									/>
									<span className='previous-button-text'>
										Previous
									</span>
								</Button>
								{/* // )} */}
								{createAssistantFlowContextDetails?.currentAssistantFlowStep !==
									AssistantFlowStep.ADD_DATA_SOURCES && (
										<button
											className='continue-button'
											onClick={
												continuesChangeHandler
											}
										>
											Continue
										</button>
									)}
							</div>
						</div>
						{/*------------------------------------------stepper-end----------------------------------------------*/}
						<CreateAssitstantContainerItems
							qaData={qaData}
							textData={textData}
							fileData={fileData}
							crawlData={crawlData}
							isModalVisible={isModalVisible}
							setIsModalVisible={setIsModalVisible}
							industryExpertList={
								industryExpertList
							}
							selecteExpertIndex={
								selecteExpertIndex
							}
							selectedExpertChangeHandler={
								selectedExpertChangeHandler
							}
							assistantList={assistantList}
							selectedAssistantIndex={
								selectedAssistantIndex
							}
							selectedAssistantChangeHandler={
								selectedAssistantChangeHandler
							}
							blankTemplateClickHandler={blankTemplateClickHandler}
							isBlankTemplateSelected={isBlankTemplateSelected}
						/>
					</>
				)}

				{/*------------------------------------------main-voicebot----------------------------------------------*/}
				{window.innerWidth < 768 && (
					<div className='mobile-stepper'>
						<div className='title-container'>
							<h2 className='title'>
								Welcome to Torri AI
							</h2>
							<span className='sub-title'>
								Let&apos;s create your own Bot
								just in 5 steps
							</span>

							<div className='voicebot-avatar'>
								<div
									className='voicebot-avatar-img'
									style={{
										backgroundImage: `url(${assistantImagePath})`,
									}}
								>
									<input
										type='file'
										id='profileImageId'
										style={{
											display: 'none',
										}}
										accept='image/*'
										onChange={
											imageHandler
										}
									/>
									<label
										htmlFor='profileImageId'
										className='file-label'
									>
										<Image
											alt=''
											src={
												galaryImg
											}
											className='galary_image'
										></Image>
									</label>
								</div>
								<div className='voicebot-avatar-img__info'>
									{/* <div className="assistant-input-wrapper"> */}
									<Input
										// className={inputValidationMessage ? "input-field invalid-input" : "input-field"}
										className={
											inputValidationMessage
												? 'assi-input-field invalid-input'
												: 'assi-input-field'
										}
										placeholder='Your Assistant Name'
										onChange={
											assistantNameChangeHandler
										}
										// onBlur={handleInputBlur}
										id='assistantNameInput'
										value={
											createAssistantFlowContextDetails?.assistantName
										}
										disabled={
											!isInputVisible
										}
									/>

									{/* </div> */}

									<Button
										style={{
											border: 'none',
											margin: 0,
											padding: 0,
											background:
												'transparent',
										}}
										icon={
											<Image
												src={
													editIcon
												}
												alt='edit name'
											/>
										}
										onClick={() => {
											setIsInputVisible(
												true
											);
											const inputElement =
												document.getElementById(
													'assistantNameInput'
												) as HTMLInputElement;
											if (
												inputElement
											) {
												inputElement.focus();
											}
										}}
									/>
								</div>
								{inputValidationMessage && (
									<p className='invalidation-message'>
										{
											inputValidationMessage
										}
									</p>
								)}
							</div>
						</div>

						<CreateAssitstantContainerItems
							qaData={qaData}
							textData={textData}
							fileData={fileData}
							crawlData={crawlData}
							isModalVisible={isModalVisible}
							setIsModalVisible={setIsModalVisible}
							industryExpertList={
								industryExpertList
							}
							selecteExpertIndex={
								selecteExpertIndex
							}
							selectedExpertChangeHandler={
								selectedExpertChangeHandler
							}
							assistantList={assistantList}
							selectedAssistantIndex={
								selectedAssistantIndex
							}
							selectedAssistantChangeHandler={
								selectedAssistantChangeHandler
							}
							blankTemplateClickHandler={blankTemplateClickHandler}
							isBlankTemplateSelected={isBlankTemplateSelected}
						/>

						<div className="mobile-stepper-navigation">
							<Steps
								className="stepper-steps"
								direction="horizontal"
								// labelPlacement="vertical"
								size="small"
								current={
									createAssistantFlowContextDetails?.currentAssistantFlowStep
								}
								items={[
									{
										/// if this steps is processed mark status as finsihsed
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_BOT_TYPE
												? "process"
												: "finish",
										title: (
											<div>
												<h3 className="steps-assistant-heading">
													Create your Assistant
												</h3>
											</div>
										),
									},
									// Only include the plan step if the user doesn't have a plan
									...(plan?.price && source == "chatbot"
										? []
										: [
											{
												status:
													createAssistantFlowContextDetails?.currentAssistantFlowStep ===
														AssistantFlowStep.CHOOSE_PLAN
														? ("process" as "process")
														: plan?.price
															? ("finish" as "finish")
															: ("wait" as "wait"),
												title: (
													<div>
														<h3 className="steps-assistant-heading">
															Select plan
														</h3>
													</div>
												),
											},
										]),
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_ASSISTANT_TYPE
												? "process"
												: createAssistantFlowContextDetails?.assistantType
													?.abbreviation
													? "finish"
													: "wait",
										title: createAssistantFlowContextDetails?.assistantType
											?.imageUrl ? (
											<div className="selected-assistant">
												<div className="mini-selected-assistant-image">
													<input
														type="file"
														id="profileImageId"
														style={{ display: "none" }}
														accept="image/*"
													// onChange={imageHandler}
													/>
													<label
														htmlFor="profileImageId"
														className="file-label"
													>
														<Image
															alt={
																createAssistantFlowContextDetails?.assistantType
																	?.title
															}
															src={
																createAssistantFlowContextDetails?.assistantType
																	?.imageUrl
															}
															width={100}
															height={100}
														></Image>
													</label>
												</div>
												<div className="selected-assistant-header">
													<h3 className="heading_title">
														{
															createAssistantFlowContextDetails?.assistantType
																?.title
														}
													</h3>
													<h4 className="heading_description">
														{
															createAssistantFlowContextDetails?.assistantType
																?.description
														}
													</h4>
												</div>
											</div>
										) : (
											<div>
												<h3 className="steps-assistant-heading">
													Choose your assistant
												</h3>
											</div>
										),
									},
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT
												? "process"
												: createAssistantFlowContextDetails?.industryExpertType
													?.abbreviation
													? "finish"
													: "wait",
										title: createAssistantFlowContextDetails?.industryExpertType
											?.imageUrl ? (
											<div className="selected-assistant">
												<div className="mini-selected-assistant-image">
													<input
														type="file"
														id="profileImageId"
														style={{ display: "none" }}
														accept="image/*"
													// onChange={imageHandler}
													/>
													<label
														htmlFor="profileImageId"
														className="file-label"
													>
														<Image
															alt={
																createAssistantFlowContextDetails
																	?.industryExpertType?.title
															}
															src={
																createAssistantFlowContextDetails
																	?.industryExpertType?.imageUrl
															}
															width={100}
															height={100}
														></Image>
													</label>
												</div>
												<div className="selected-assistant-header">
													<h3 className="heading_title">
														{
															createAssistantFlowContextDetails
																?.industryExpertType?.title
														}
													</h3>
													<h4 className="heading_description">
														{
															createAssistantFlowContextDetails
																?.industryExpertType?.description
														}
													</h4>
												</div>
											</div>
										) : (
											<div>
												<h3 className="steps-assistant-heading">
													Choose your Industry Expert
												</h3>
											</div>
										),
									},
									{
										status:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.ADD_DATA_SOURCES
												? "process"
												: "wait",
										title: (
											<div>
												<h3 className="steps-assistant-heading">
													Customize more
												</h3>
											</div>
										),
									},
								]}
							/>

							<div className={'navigation-button'}>
								{/* {voiceBotContextData.currentAssistantPage !== 0 && ( */}
								<Button
									className='previous-button'
									onClick={
										previousChangeHandler
									}
									style={{
										visibility:
											createAssistantFlowContextDetails?.currentAssistantFlowStep ===
												AssistantFlowStep.CHOOSE_BOT_TYPE
												? 'hidden'
												: 'visible',
									}}
								>
									<Image
										className='arrow-left'
										alt='left arrow'
										src={leftArrow}
										width={100}
										height={100}
									/>
								</Button>
								{/* // )} */}
								<button
									className='continue-button'
									onClick={
										continuesChangeHandler
									}
								>
									Continue
								</button>
							</div>
						</div>
					</div>
				)}
				{/*------------------------------------------main-voicebot-end----------------------------------------------*/}
			</div>
		);
	}
}
