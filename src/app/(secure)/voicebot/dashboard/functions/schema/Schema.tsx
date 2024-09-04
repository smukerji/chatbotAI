import "./design.scss";
import { Input, Slider, Switch, Select, Button } from 'antd';

import Image from "next/image";

function Schema() {
  return (
    <div className="schema-container">
     
      <div className="input-container">
        <h4 className="lable-text">Property name</h4>

        <Input className="max-token-input" placeholder="Goodbye" />
      </div>
      <div className="input-container">
        <h4 className="lable-text">Describe the property</h4>

        <Input className="max-token-input" placeholder="Goodbye" />
      </div>
      <div className="bottom-container">
      
        <Select className="select-field"
          placeholder="Data Type"
          options={[
            { value: '1', label: 'string' },
            { value: '2', label: 'number' },
            { value: '3', label: 'boolean' },
            { value: '4', label: 'object' },
            { value: '5', label: 'array' },
          ]}
        />
    
        <div className="button-container-d-s">
          <Button className="delete">Delete</Button>
          <Button className="save">Save</Button>
        </div>
      </div>
    </div>
  )
}

export default Schema