'use client'
import React from 'react'
import SwaggerUI from 'swagger-ui-react';
import  'swagger-ui-react/swagger-ui.css';

function ReactSwagger({spec}:any) {
  return (
   <SwaggerUI spec={spec} />
  )
}

export default ReactSwagger;