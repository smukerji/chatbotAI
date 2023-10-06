"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "./testimonials.css";
import "swiper/css";
import QuoteImg from "../../../../public/sections-images/testimonials-section/Group 27.svg";
import ProfileImg from "../../../../public/sections-images/testimonials-section/Ellipse 1.svg";
import SlideLeftImg from "../../../../public/sections-images/common/slide-left.svg";
import SlideRightImg from "../../../../public/sections-images/common/slide-right.svg";
import TestimonialsText from "../../../../public/sections-images/common/testimonials-text.svg";

function Testimonials() {
  const [mySwiper, setSwiper]: any = useState({});
  return (
    <div className="testimonials-section-container">
      {/* ------------------------------top section------------------------------- */}
      <div className="top">
        <div className="testimonials-text">
          <Image src={TestimonialsText} alt="testimonials-text" />
          <h1 className="testimonials-welcome-text">
            SOME OF OUR TESTIMONIALS
          </h1>
          {/* <hr className="industry-welcome-text-decorator" /> */}
        </div>
      </div>

      {/* ------------------------------bottom section------------------------------- */}
      <div className="bottom slider-wrapper">
        <button
          className="prev-slide-btn"
          onClick={() => {
            mySwiper.slidePrev();
          }}
        >
          <Image src={SlideLeftImg} alt={"slide-left-button-img"} />
        </button>
        <Swiper
          slidesPerView={1}
          onInit={(e) => {
            setSwiper(e);
          }}
        >
          <SwiperSlide>
            <div className="testimonial-container">
              <div className="profile-img">
                <Image className="quote-img" src={QuoteImg} alt={"quote-img"} />
                <Image src={ProfileImg} alt={"profile-img"} />
              </div>
              <h3 className="profile-name">Ankita Roy</h3>
              <div className="profile-note">
                In publishing and graphic design, Lorem ipsum is a placeholder
                text commonly used to demonstrate the visual form of a document
                or a typeface without relying on meaningful content.
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="testimonial-container">
              <div className="profile-img">
                <Image className="quote-img" src={QuoteImg} alt={"quote-img"} />
                <Image src={ProfileImg} alt={"profile-img"} />
              </div>
              <h3 className="profile-name">Ankita Roy</h3>
              <div className="profile-note">
                In publishing and graphic design, Lorem ipsum is a placeholder
                text commonly used to demonstrate the visual form of a document
                or a typeface without relying on meaningful content.
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="testimonial-container">
              <div className="profile-img">
                <Image className="quote-img" src={QuoteImg} alt={"quote-img"} />
                <Image src={ProfileImg} alt={"profile-img"} />
              </div>
              <h3 className="profile-name">Ankita Roy</h3>
              <div className="profile-note">
                In publishing and graphic design, Lorem ipsum is a placeholder
                text commonly used to demonstrate the visual form of a document
                or a typeface without relying on meaningful content.
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="testimonial-container">
              <div className="profile-img">
                <Image className="quote-img" src={QuoteImg} alt={"quote-img"} />
                <Image src={ProfileImg} alt={"profile-img"} />
              </div>
              <h3 className="profile-name">Ankita Roy</h3>
              <div className="profile-note">
                In publishing and graphic design, Lorem ipsum is a placeholder
                text commonly used to demonstrate the visual form of a document
                or a typeface without relying on meaningful content.
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
        <button
          className="next-slide-btn"
          onClick={() => {
            mySwiper.slideNext();
          }}
        >
          <Image src={SlideRightImg} alt={"slide-right-button-img"} />
        </button>
      </div>
    </div>
  );
}

export default Testimonials;
