import { Action } from '@ngrx/store';

export enum NewProjectScreen {
  Welcome,
  Layout,
  Template,
  PackageDetails,
  Creating,
  Complete,
}

export const enum NewProjectActionTypes {
  CHANGE_SCREEN = '[NewProject] Set Displayed Screen',
  SET_TARGET_DIRECTORY = '[NewProject] Set Target Directory',
  SET_LAYOUT = '[NewProject] Set Starter Layout',
  SET_PACKAGE_DETAILS = '[NewProject] Set Package Details',
  CREATE_START = '[NewProject] Start Project Creation',
  CREATE_UPDATE = '[NewProject] Update Creation Status',
  CREATE_ERROR = '[NewProject] Set Creation Error State',
  CREATE_COMPLETE = '[NewProject] Set Project Creation Completed',
  CANCEL = '[NewProject] Cancel Project Creation',
}

export const enum NewProjectMethods {
  ChooseDirectory = '[NewProject] Choose Target Directory',
  StartCrate = '[NewProject] Start Project Creation',
}

export class ChangeScreen implements Action {
  public readonly type = NewProjectActionTypes.CHANGE_SCREEN;

  constructor(public readonly screen: NewProjectScreen) {}
}

export class Cancel implements Action {
  public readonly type = NewProjectActionTypes.CANCEL;
}

export class SetTargetDirectory implements Action {
  public readonly type = NewProjectActionTypes.SET_TARGET_DIRECTORY;

  constructor(public readonly directory: string) {}
}

export class SetLayout implements Action {
  public readonly type = NewProjectActionTypes.SET_LAYOUT;

  constructor(public readonly layout: string) {}
}

export type NewProjectActions = ChangeScreen | Cancel | SetTargetDirectory | SetLayout;
