import { combineReducers } from "redux";
import { UPDATE_TUTORIALS } from "./actions";

const tutorialsReducer = (
  state = { color: "coral", current_topic: [], steps: [{ step: "" }], title: "", create_topic: [] },
  action
) => {
  switch (action.type) {
    case UPDATE_TUTORIALS:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};

export default reducer = combineReducers({
  tutorials: tutorialsReducer
});
