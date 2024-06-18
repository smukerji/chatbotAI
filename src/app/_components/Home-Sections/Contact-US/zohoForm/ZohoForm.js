import React, { useEffect, useRef, useState } from "react";
import "./zohoForm.scss";
import Head from "next/head";
import { message } from "antd";

const ZohoForm = () => {
  const [errors, setErrors] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const imgRef = useRef(null);
  const formRef = useRef(null);

  async function sendEmail() {
    const name = document.querySelector("input[name='LASTNAME']");
    const mobile = document.querySelector("input[name='MOBILE']");
    const email = document.querySelector("input[name='CONTACT_EMAIL']");
    // const userMessage = document.querySelector("textarea[name='CONTACT_CF1']");

    const formData = {
      values: {
        name: name.value,
        mobile: mobile.value,
        email: email.value,
        // user_message: userMessage.value,
      },
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/contact-mail/api`,
        {
          method: "POST",
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        message.success("Response saved successfully");
        // Handle successful form submission
      } else {
        message.error("Error submitting response");
        // Handle error in form submission
      }
    } catch (error) {
      message.error("Error:", error.message);
    }
  }
  useEffect(() => {
    // load the script to save domain in hidden field

    const script = document.createElement("script");
    script.src = "https://zc1.maillist-manage.in/js/optin.min.js";
    script.onload = () => {
      if (window.setupSF) {
        window.setupSF(
          "sf3z3445ada2863b1460c0440ca9b6d50444b0539e5dae5bf84e62e5cfe38ad15acb",
          "ZCFORMVIEW",
          false,
          "light",
          false,
          "3"
        );
      }
      if (window.recaptcha) {
        window.recaptcha.render("recaptcha-element-id");
      }
    };
    document.body.appendChild(script);

    const url = window.location.href;
    const contactCf2Input = document.querySelector("input[name='CONTACT_CF2']");
    if (contactCf2Input) {
      contactCf2Input.value = url;
    }

    // form validation function
    const validateForm = async (event) => {
      event.preventDefault();

      let error = { name: "", mobile: "", email: "" };
      const name = document.querySelector("input[name='LASTNAME']");
      const mobile = document.querySelector("input[name='MOBILE']");
      const email = document.querySelector("input[name='CONTACT_EMAIL']");

      let valid = true;

      // console.log(userMessage);

      if (!name.value.trim()) {
        error.name = "Name is required.";
        valid = false;
      }

      if (!mobile.value.trim()) {
        error.mobile = "Mobile is required.";
        valid = false;
      }

      if (!/\S+@\S+\.\S+/.test(email.value)) {
        error.email = "Email is invalid.";
        valid = false;
      }

      if (!email.value.trim()) {
        error.email = "Email is required.";
        valid = false;
      }

      setErrors(error);

      if (valid) {
        await sendEmail();
        const form = document.getElementById("zcampaignOptinForm");
        form.submit();
        // form.reset();
        // window.location.reload();
      }
    };

    const submitButton = document.getElementById("zcWebOptin");
    if (submitButton) {
      submitButton.addEventListener("click", validateForm);
    }

    return () => {
      document.body.removeChild(script);
      if (submitButton) {
        submitButton.removeEventListener("click", validateForm);
      }
    };
  }, []);

  // useEffect(() => {
  //   if (imgRef.current) {
  //     imgRef.current.onload = function () {
  //       referenceSetter(this);
  //     };
  //   }
  // }, []);

  return (
    <>
      <Head>
        <meta
          content="width=device-width,initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
          name="viewport"
        ></meta>
      </Head>

      <div
        id="sf3z3445ada2863b1460c0440ca9b6d50444b0539e5dae5bf84e62e5cfe38ad15acb"
        data-type="signupform"
      >
        <div id="customForm">
          <input type="hidden" id="recapTheme" value="3" />
          <input type="hidden" id="isRecapIntegDone" value="true" />

          <input type="hidden" id="signupFormMode" value="copyCode" />
          <input type="hidden" id="signupFormType" value="LargeForm_Vertical" />
          <input type="hidden" id="recapModeTheme" value="" />
          <input type="hidden" id="signupFormMode" value="copyCode" />
          <div name="SIGNUP_PAGE" className="large_form_1_css" id="SIGNUP_PAGE">
            <div name="" changeid="" changename="">
              <div id="imgBlock" name="LOGO_DIV" logo="true"></div>
            </div>
            <br />
            <div
              id="signupMainDiv"
              name="SIGNUPFORM"
              changeid="SIGNUPFORM"
              changename="SIGNUPFORM"
            >
              <div>
                <div style={{ position: "relative" }}>
                  <div
                    id="Zc_SignupSuccess"
                    style={{
                      display: "none",
                      position: "absolute",
                      marginLeft: "4%",
                      width: "90%",
                      backgroundColor: " white",
                      padding: " 3px",
                      border: " 3px solid rgb(194, 225, 154)",
                      marginTop: " 10px",
                      marginBottom: "10px",
                      wordBreak: "break-all",
                    }}
                  >
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      border="0"
                    >
                      <tbody>
                        <tr>
                          <td width="10%">
                            <img
                              className="successicon"
                              src="https://zc1.maillist-manage.in/images/challangeiconenable.jpg"
                              align="absmiddle"
                            />
                          </td>
                          <td>
                            <span
                              id="signupSuccessMsg"
                              style={{
                                color: "rgb(73, 140, 132)",
                                fontFamily: "sans-serif",
                                fontSize: "14px",
                                wordBreak: "break-word",
                              }}
                            >
                              &nbsp;&nbsp;Thank you for Signing Up
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <form
                  method="POST"
                  id="zcampaignOptinForm"
                  action="https://zc1.maillist-manage.in/weboptin.zc"
                  target="_zcSignup"
                >
                  <div id="SIGNUP_BODY_ALL" name="SIGNUP_BODY_ALL">
                    <div id="SIGNUP_BODY" name="SIGNUP_BODY">
                      <div>
                        <div className="contact-form">
                          <div name="fieldsdivSf" className="zcsffieldsdiv">
                            <div>
                              <div>
                                <div className="zcinputbox">
                                  <input
                                    name="LASTNAME"
                                    changeitem="SIGNUP_FORM_FIELD"
                                    maxLength="100"
                                    type="text"
                                    placeholder="Name"
                                  />
                                  <span
                                    style={{ display: "none" }}
                                    id="dt_LASTNAME"
                                  >
                                    1,false,1,Last Name,2
                                  </span>
                                  {errors.name && (
                                    <span className="require">
                                      {errors.name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div></div>
                            </div>
                            <div>
                              <div>
                                <div className="zcinputbox">
                                  <input
                                    name="MOBILE"
                                    changeitem="SIGNUP_FORM_FIELD"
                                    maxLength="100"
                                    type="text"
                                    placeholder="Mobile"
                                  />
                                  <span
                                    style={{ display: "none" }}
                                    id="dt_MOBILE"
                                  >
                                    1,false,1,Mobile,2
                                  </span>
                                  {errors.mobile && (
                                    <span className="require">
                                      {errors.mobile}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div></div>
                            </div>
                            <div>
                              <div>
                                <div className="zcinputbox">
                                  <input
                                    name="CONTACT_EMAIL"
                                    changeitem="SIGNUP_FORM_FIELD"
                                    maxLength="100"
                                    type="email"
                                    placeholder="Email"
                                  />
                                  <span
                                    style={{ display: "none" }}
                                    id="dt_CONTACT_EMAIL"
                                  >
                                    1,true,6,Contact Email,2
                                  </span>
                                  {errors.email && (
                                    <span className="require">
                                      {errors.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div></div>
                            </div>
                            {/* <div>
                              <div>
                                <div className="zcinputbox">
                                  <span
                                    style={{ display: "none" }}
                                    id="dt_CONTACT_CF2"
                                  >
                                    1,true,9,Page URL,2
                                  </span>
                                </div>
                              </div>
                              <div></div>
                            </div> */}
                            <div>
                              <div>
                                <div className="zcinputbox">
                                  <textarea
                                    name="CONTACT_CF1"
                                    changeitem="SIGNUP_FORM_FIELD"
                                    zc_display_name="Message Field"
                                    // maxLenght="2000"
                                    placeholder="Message"
                                  />
                                  <span
                                    style={{ display: "none" }}
                                    id="dt_CONTACT_CF1"
                                  >
                                    1,false,5,Message Field,2
                                  </span>
                                </div>
                                <div></div>
                              </div>
                              <div></div>
                            </div>
                          </div>
                          <div
                            className="recapDivlight recaptcha"
                            id="recapDiv"
                            onChange={() => console.log("dasd")}
                          ></div>
                          <input
                            type="hidden"
                            id="secretid"
                            value="6LdNeDUUAAAAAG5l7cJfv1AA5OKLslkrOa_xXxLs"
                          />
                          <div></div>

                          <div>
                            <input
                              type="button"
                              action="Save"
                              id="zcWebOptin"
                              name="SIGNUP_SUBMIT_BUTTON"
                              changetype="SIGNUP_SUBMIT_BUTTON_TEXT"
                              value="Submit"
                              className="contact-submit"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="hidden"
                      id="fieldBorder"
                      value=""
                      onLoad={() => ""}
                    />
                    <input
                      type="hidden"
                      name="zc_trackCode"
                      id="zc_trackCode"
                      value="ZCFORMVIEW"
                      onLoad={() => ""}
                    />
                    <input
                      name="CONTACT_CF2"
                      changeitem="SIGNUP_FORM_FIELD"
                      type="hidden"
                      value=""
                    />
                    <input
                      type="hidden"
                      name="viewFrom"
                      id="viewFrom"
                      value="URL_ACTION"
                    />
                    <input
                      type="hidden"
                      id="submitType"
                      name="submitType"
                      value="optinCustomView"
                    />
                    <input
                      type="hidden"
                      id="lD"
                      name="lD"
                      value="1276d00f6d07ab7f"
                    />
                    <input
                      type="hidden"
                      name="emailReportId"
                      id="emailReportId"
                      value=""
                    />
                    <input
                      type="hidden"
                      name="zx"
                      id="cmpZuid"
                      value="1dfa07174b"
                    />
                    <input type="hidden" name="zcvers" value="2.0" />
                    <input
                      type="hidden"
                      name="oldListIds"
                      id="allCheckedListIds"
                      value=""
                    />
                    <input
                      type="hidden"
                      id="mode"
                      name="mode"
                      value="OptinCreateView"
                    />
                    <input
                      type="hidden"
                      id="zcld"
                      name="zcld"
                      value="1276d00f6d07ab7f"
                    />
                    <input
                      type="hidden"
                      id="zctd"
                      name="zctd"
                      value="1276d00f6d07aa49"
                    />
                    <input type="hidden" id="document_domain" value="" />
                    <input
                      type="hidden"
                      id="zc_Url"
                      value="zc1.maillist-manage.in"
                    />
                    <input type="hidden" id="new_optin_response_in" value="0" />
                    <input
                      type="hidden"
                      id="duplicate_optin_response_in"
                      value="0"
                    />
                    <input
                      type="hidden"
                      id="zc_formIx"
                      name="zc_formIx"
                      value="3z3445ada2863b1460c0440ca9b6d50444b0539e5dae5bf84e62e5cfe38ad15acb"
                    />
                  </div>
                </form>
              </div>
              {/* <div id="privacyNotes" identity="privacyNotes">
                <span>
                  Note: It is our responsibility to protect your privacy and we
                  guarantee that your data will be completely confidential.
                </span>
              </div> */}
            </div>
          </div>
          <input type="hidden" id="isCaptchaNeeded" value="true" />
          <input type="hidden" id="superAdminCap" value="0" />
          <img
            ref={imgRef}
            src="https://zc1.maillist-manage.in/images/spacer.gif"
            id="refImage"
            // onload="referenceSetter(this)"
            style={{ display: "none" }}
          />
        </div>
      </div>
      <div
        id="zcOptinOverLay"
        onContextMenu={() => false}
        style={{
          display: "none",
          textAlign: "center",
          backgroundColor: "rgb(0, 0, 0)",
          opacity: "0.5",
          zIndex: 100,
          position: "fixed",
          width: "100%",
          top: "0px",
          left: "0px",
          height: "988px",
        }}
      ></div>
      <div
        id="zcOptinSuccessPopup"
        style={{
          display: "none",
          zIndex: "9999",
          width: "800px",
          height: "40%",
          top: "84px",
          position: "fixed",
          left: "26%",
          backgroundColor: "#FFFFFF",
          borderColor: "#E6E6E6",
          borderStyle: "solid",
          borderWidth: "1px",
          boxShadow: "0 1px 10px #424242",
          padding: "35px",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "-16px",
            right: "-14px",
            zIndex: 99999,
            cursor: "pointer",
          }}
          id="closeSuccess"
        >
          <img src="https://zc1.maillist-manage.in/images/videoclose.png" />
        </span>
        <div id="zcOptinSuccessPanel"></div>
      </div>
    </>
  );
};

export default ZohoForm;
