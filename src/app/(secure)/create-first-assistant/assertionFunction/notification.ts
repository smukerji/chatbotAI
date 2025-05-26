import {  message } from "antd";
export function assertMessageExist(condition:any,userMessage:string): asserts condition{
    if(condition){
        message.success(userMessage);
    }
}
