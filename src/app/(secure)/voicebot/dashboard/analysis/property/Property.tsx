import dynamic from "next/dynamic";
import "./design.scss";
import { useState } from "react";
import { Input, Select, Slider, Switch, Button, } from 'antd';
import Image from "next/image";
import addImge from "../../../../../../../public/voiceBot/SVG/add.svg";
const { TextArea } = Input;

function Property() {

  const [stepsCount, setStepsCount] = useState<number>(5);
  const [properties, setProperties] = useState<{ id: number; type: string; name: string; description: string }[]>([]);
  const [currentProperty, setCurrentProperty] = useState<{ id: number; type: string; name: string; description: string }>();

  const addPropertyHandler = () => {
    if (currentProperty) return; // Prevent adding a new property if the current one is not stored

    const newProperty = { id: properties.length + 1, type: '', name: '', description: '' };
    setCurrentProperty(newProperty);
    setProperties([...properties, newProperty]);
  };

  const savePropertyHandler = (id: number) => {
    if (!currentProperty) return;

    setProperties(properties.map(prop => prop.id === id ? currentProperty : prop));
    setCurrentProperty(undefined);
  };

  const deletePropertyHandler = (id: number) => {
    setProperties(properties.filter(prop => prop.id !== id));
    setCurrentProperty(undefined);
  };

  const currentPropertyChangeHandler = (id:number,options:any)=>{

    debugger;
    if (currentProperty) {
      setCurrentProperty({ ...currentProperty, type: options.label });
      //set type into property too
      setProperties(properties.map(prop => prop.id === id ? { ...prop, type: options.label } : prop));     
    }

  }

  console.log("current property", currentProperty);

  return (
    <div className="data-schema">
      <h3 className="title_">Data Schema</h3>
      <p className="description">This defines the structure of the data to be extracted. Add various properties you want in the Structured Data Output.</p>
      <Button className="property-button" onClick={addPropertyHandler} disabled={!!currentProperty}>
        <div className="button-wrapper">
          <Image alt="add-button" src={addImge}></Image>
          <span className="text">Add Properties</span>
        </div>
      </Button>
      
         {properties.map((property, index) => (
          <div key={property.id} className="property-data">
            <div className="data-type">
              <Select
                className="select-field"
                placeholder="Select Data type"
                value={property.type}
                  onChange={(_:string,options:any)=>currentPropertyChangeHandler(property.id,options)}
                options={[
                  { value: '1', label: 'String' },
                  { value: '2', label: 'Number' },
                  { value: '3', label: 'Boolean' },
                  { value: '4', label: 'Object' },
                  { value: '5', label: 'Array' }
                ]}
              />
              <div className="button-wrapper">
                <Button className="delete" onClick={() => deletePropertyHandler(property.id)}>
                  delete
                </Button>
                <Button className="save" onClick={() => savePropertyHandler(property.id)}>
                  save
                </Button>
              </div>
            </div>
            <Input
              className="max-token-input"
              placeholder="Property Name"
              value={property.name}
              onChange={(e) => setCurrentProperty({ ...property, name: e.target.value })}
            />
            <TextArea
              className="max-token-input"
              placeholder="Describe the property, its purpose, its use, etc."
              value={property.description}
              onChange={(e) => setCurrentProperty({ ...property, description: e.target.value })}
            />
          </div>
      ))}

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Property), { ssr: false });