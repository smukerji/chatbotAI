import "./design.scss";
import { Input, Slider, Switch, Select, Button } from 'antd';
const { TextArea } = Input;

function ToolFor() {
  return (
    <div className="tool-for-container">

      <div className="input-container">
        <h4 className="lable-text">Name</h4>

        <Input className="max-token-input" placeholder="Goodbye" />
      </div>
      <div className="input-container">
        <h4 className="lable-text">Describtion</h4>

        <TextArea className="text-area" rows={4} placeholder="Describe the property,it's purpose, it's use..." />

      </div>
     
    </div>
  )
}

export default ToolFor