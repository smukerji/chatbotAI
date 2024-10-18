import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Select, Slider, Switch, Button,message } from 'antd';
import Image from "next/image";
import addImge from "../../../../../../../public/voiceBot/SVG/add.svg";
const { TextArea } = Input;

import { useState, useContext, useEffect } from "react";

import { CreateVoiceBotContext } from "../../../../../_helpers/client/Context/VoiceBotContextApi"

function Property() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const [stepsCount, setStepsCount] = useState<number>(5);
  const [properties, setProperties] = useState<{ id: number; type: string; name: string; description: string,saved:boolean }[]>([]);
  const [currentProperty, setCurrentProperty] = useState<{ id: number; type: string; name: string; description: string }>();

  useEffect(() => {
    if (properties.every(prop => prop.saved)) {
      setCurrentProperty(undefined);
    }

    //stored into the contextAPI
    voiceBotContextData.updateState("analysisPlan.structuredDataSchema.properties", properties);

  }, [properties]);

  console.log("Context analysis ", voicebotDetails["analysisPlan"]);


  const addPropertyHandler = () => {
    if (currentProperty) return; // Prevent adding a new property if the current one is not stored

    const newProperty = { id: properties.length + 1, type: '', name: '', description: '' , saved:false};
    setCurrentProperty(newProperty);
    setProperties([...properties, newProperty]);
  };



  const savePropertyHandler = (id: number) => {
    //based on the property id if type or name is empty then show error message
    const property = properties.find(prop => prop.id === id);
    if (!property?.type || !property?.name) {
      message.error('Please fill all fields');
      return;
    }
    //update the property to save
    setProperties(properties.map(prop => prop.id === id ? { ...prop, saved: true } : prop));

    //check if properties are saved then set current property to undefined
   
    //stored into the contextAPI


  };

  const deletePropertyHandler = (id: number) => {
    setProperties(properties.filter(prop => prop.id !== id));
    // setCurrentProperty(undefined);
  };

  const currentPropertyChangeHandler = (id:number,options:any)=>{

    debugger;
    if (currentProperty) {
      setCurrentProperty({ ...currentProperty, type: options.label });
      //set type into property too
      setProperties(properties.map(prop => prop.id === id ? { ...prop, type: options.label } : prop));     
    }

  }

  const storedPropertyByIndexChangeHandler = (id: number,fieldName:string,value:string) => {
    switch (fieldName) {
      case 'type':
      setProperties(properties.map(prop => prop.id === id ? { ...prop, type: value, saved: false } : prop));
      const newProperty = { id: id, type: value, name: '', description: '' , saved:false};
      setCurrentProperty(newProperty);
      break;

      case 'name':
      setProperties(properties.map(prop => prop.id === id ? { ...prop, name: value, saved: false } : prop));
      const newProperty1 = { id: id, type: '', name: value, description: '' , saved:false};
      setCurrentProperty(newProperty1);
      break;

      case 'description':
      setProperties(properties.map(prop => prop.id === id ? { ...prop, description: value, saved: false } : prop));
      const newProperty2 = { id: id, type: '', name: '', description: value , saved:false};
      setCurrentProperty(newProperty2);
      break;
    }

  }

  const currentPropertyNameChangeHandler = (id:number,input:string) => {
    if (currentProperty) {
      setCurrentProperty({ ...currentProperty, name: input });
      //set name into property too
      setProperties(properties.map(prop => prop.id === id ? { ...prop, name: input } : prop));
    }
  }

  console.log("property", properties);

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
      <div key={property.id} className={`property-data`}>
        <div className="data-type">
        <Select
          className={property.saved ? "select-field saved" : "select-field"}
          placeholder="Select Data type"
          value={property.type ? property.type : undefined}
          onChange={(_: string, options: any) => storedPropertyByIndexChangeHandler(property.id, 'type', options.label)}
          options={[
          { value: '1', label: 'string' },
          { value: '2', label: 'number' },
          { value: '3', label: 'boolean' },
          { value: '4', label: 'object' },
          { value: '5', label: 'array' },
          { value: '6', label: 'integer'}
          ]}

          /**
           * string, number, integer, boolean, array, object
           */
          // disabled={property.saved}
        />
        <div className="button-wrapper">
          <Button className="delete" onClick={() => deletePropertyHandler(property.id)}>
          delete
          </Button>
          <Button className="save" onClick={() => savePropertyHandler(property.id)}>
          {property.saved ? 'update' : 'save'}
          </Button>
        </div>
        </div>
        <Input
        className={property.saved ? "max-token-input saved" : "max-token-input"}
        placeholder="Property Name"
        value={property.name}
        onChange={(e) => storedPropertyByIndexChangeHandler(property.id, 'name', e.target.value)}
        // disabled={property.saved}
        />
        <TextArea
        className={property.saved ? "max-token-input saved" : "max-token-input"}
        placeholder="Describe the property, its purpose, its use, etc."
        value={property.description}
        onChange={(e) => storedPropertyByIndexChangeHandler(property.id, 'description', e.target.value)}
        // disabled={property.saved}
        />
      </div>
      ))}
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Property), { ssr: false });