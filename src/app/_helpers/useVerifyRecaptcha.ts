import { useCallback, useEffect, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const useVerifyReCaptcha = () => {
  const [token, setToken] = useState<string>();
  const [captchaVerifyMessage, setCaptchaVerifyMessage] = useState<string>();

  const { executeRecaptcha } = useGoogleReCaptcha();
  const handleReCaptchaVerify: () => Promise<boolean> =
    useCallback(async () => {
      if (!executeRecaptcha) {
        return false;
      }
      const token = await executeRecaptcha('yourAction')
        .then((res) => {
          console.log(res, 'res');
          setToken(res);
        })
        .catch((error) => {
          console.log(error);
          setCaptchaVerifyMessage(
            "Sorry, we couldn't verify your CAPTCHA. Please try again."
          );
        });
      return true;
    }, [executeRecaptcha]);

  useEffect(() => {
    handleReCaptchaVerify();
  }, [handleReCaptchaVerify]);
  return { token, captchaVerifyMessage, handleReCaptchaVerify };
};

export default useVerifyReCaptcha;
