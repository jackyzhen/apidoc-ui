// @flow
import type { Enum, Service } from './generated/version/ServiceType';

import { browserHistory } from 'react-router';

const cleanPath = (path: string): ?string => path.replace(/\W/g, '');

const onClickHref = (href: string) => (event: Object): void => {
  browserHistory.push(href);
  // Stop parent nav events to be publishes - jsondoc nesting
  if (event.stopPropagation) event.stopPropagation();
};

const getType = (type: string) => {
  const ex = /[\[]?([^\]]+)/i;
  const matched = type.match(ex);
  return matched && matched[1];
};

const simplifyName = (name: string) => {
  const splitName = name.split('.');
  const joined = splitName.map((word) =>
    word.search('v[0-9]+') > -1 ? word : word.substring(0, word.search('[A-Za-z]') + 1)
  ).join('.');
  return `${joined.substring(0, joined.lastIndexOf('.') - 1)}${splitName[splitName.length - 1]}`;
};

const findByName = <T: {name: string}>(name: string, values: Array<T>): T =>
  values.find(v => v.name === getType(name));

const getEnumImport = (name, imports) => {
  const service = imports.find(importValue => importValue.enums.find(e => e.name === getType(name)));
  return service ? findByName(name, service.enums) : null;
};

const getModelImport = (name, imports) => {
  const service = imports.find(importValue => importValue.models.find(e => e.name === getType(name)));
  return service ? findByName(name, service.models) : null;
};
/* eslint-disable no-use-before-define */

const getEnum = (name: string, service: Service, imports: ?Array<Service>) =>
  imports && isImport(name, imports) ? getEnumImport(name, imports) : findByName(name, service.enums);

const getModel = (name: string, service: Service, imports: ?Array<Service>) =>
  imports && isImport(name, imports) ? getModelImport(name, imports) : findByName(name, service.models);

const isEnum = (type: string, service: Service, imports: ?Array<Service>) => Boolean(getEnum(type, service, imports));

const isModel = (type: string, service: Service, imports: ?Array<Service>) => Boolean(getModel(type, service, imports));

const isInService = (type: string, service: Service) => {
  const actualType = getType(type);
  if (actualType) {
    return isModel(actualType, service) || isEnum(actualType, service);
  } else {
    return false;
  }
};

const isImport = (type: string, imports: Array<Service>) =>
  Boolean(imports.map((importValue) => isInService(type, importValue)).find(b => b === true));

/* eslint-enable no-use-before-define */

const isImportOrInService = (type: string, service: Service, imports: Array<Service>) =>
  isInService(type, service) || isImport(type, imports);

const isArray = (type: string) => type.startsWith('[');

const getEnumExampleValue = (enumModel: Enum) => enumModel.values[0].name;

const isISODateTime = (type: string) => type === 'date-iso8601';

const getOperation = (type: string, method: string, path: string, service: Service) => {
  const resource = service.resources.find(r => r.type === type);
  const operation = resource.operations.find((o) => (
        o.method.toLowerCase() === method && cleanPath(o.path) === path
    ));
  return operation;
};

const buildNavHref = ({ organization, documentation, application, resource, method, path, model, field }: {
  organization?: string,
  documentation?: string,
  application?: string,
  resource?: string,
  method?: string,
  path?: string,
  model?: string,
  field?: string,
}) =>
  [].concat(organization ? `/org/${organization}` : null,
    documentation ? `/doc/${documentation}` : null,
    application ? `/app/${application}` : null,
    resource ? `/r/${resource}` : null,
    method ? `/m/${method}` : null,
    path ? `/p/${path}` : null,
    model ? `/m/${model}` : null,
    field ? `#${field}` : null).join('');

export {
  cleanPath,
  onClickHref,
  getType,
  simplifyName,
  getModel,
  isModel,
  getEnum,
  isEnum,
  isArray,
  isImport,
  isInService,
  isImportOrInService,
  getEnumExampleValue,
  isISODateTime,
  getOperation,
  buildNavHref,
};
