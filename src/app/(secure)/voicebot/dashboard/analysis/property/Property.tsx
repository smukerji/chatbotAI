import dynamic from "next/dynamic";
import "./design.scss";
import { useState } from "react";
import { Input, Select, Slider, Switch, Button, } from 'antd';
import Image from "next/image";
import addImge from "../../../../../../../public/voiceBot/SVG/add.svg";
const { TextArea } = Input;

function Property() {

  const [stepsCount, setStepsCount] = useState<number>(5);
  return (
    <div className="data-schema">
      <h3 className="title_">Data Schema</h3>
      <p className="description">This defines the structure of the data to be extracted. Add various properties you want in the Structured Data Output.</p>
      <Button className="property-button">
        <div className="button-wrapper">
          <Image alt="add-button" src={addImge}></Image>
          <span className="text">Add Properties</span>
        </div>
      </Button>
      <div className="property-data">
        <div className="data-type">

          <Select
            className="select-field"

            placeholder="Select Data type"

            options={[
              {
                value: '1',
                label: 'deepgram',
              },
              {
                value: '2',
                label: 'talkscriber',
              },
              {
                value: '3',
                label: 'gladia',
              }
            ]}
          />
          <div className="button-wrapper">
            <Button className="delete">
              delete
            </Button>
            <Button className="save">
              save
            </Button>
          </div>

        </div>

        <Input className="max-token-input" placeholder="Property Name" />

        <Input className="max-token-input" placeholder="Describe the property, its purpose, its use, etc." />

      </div>

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Property), { ssr: false });