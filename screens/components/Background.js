import React from "react";
import { LinearGradient } from "expo-linear-gradient";

export default class Background extends React.Component {
  render() {
    return (
      <LinearGradient
        colors={["#bcd4e6", "#d6e2e9", "#fff"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "100%",
        }}
      />
    );
  }
}
