import { createContext, useState } from 'react';

export const UserDetailsContext = createContext({});

export const UserDetailsDataProvider = ({ children }: any) => {
  const initialUserDetails = {
    totalMessageCount: 0,
    noOfChatbotsUserCreated: 0,
    plan: {},
    percent: 0,
    planExpiry: null,
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
  };

  const [userDetails, setUserDetails] = useState(initialUserDetails);

  /// handle individual the changes
  const handleChange = (props: any) => (value: any) => {
    setUserDetails((preUserDetails) => ({
      ...preUserDetails,
      [props]: value,
    }));
  };

  return (
    <UserDetailsContext.Provider value={{ userDetails, handleChange }}>
      {children}
    </UserDetailsContext.Provider>
  );
};
