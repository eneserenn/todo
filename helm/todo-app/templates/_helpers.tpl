{{/*
Expand the name of the chart.
*/}}
{{- define "todo-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Database service name
*/}}
{{- define "todo-app.dbFullname" -}}
{{- printf "%s-postgresql" (include "todo-app.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "todo-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
helm.sh/chart: {{ include "todo-app.chart" . }}
{{ include "todo-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
DB selector labels
*/}}
{{- define "todo-app.dbSelectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}-postgresql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name
*/}}
{{- define "todo-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "todo-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database URL - internal or external
*/}}
{{- define "todo-app.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s:5432/%s" .Values.postgresql.user .Values.postgresql.password (include "todo-app.dbFullname" .) .Values.postgresql.database }}
{{- else }}
{{- .Values.postgresql.externalUrl }}
{{- end }}
{{- end }}

{{/*
OpenShift-compatible security context (works with restricted-v2 SCC)
*/}}
{{- define "todo-app.securityContext" -}}
runAsNonRoot: true
allowPrivilegeEscalation: false
seccompProfile:
  type: RuntimeDefault
capabilities:
  drop:
    - ALL
{{- end }}

{{/*
Pod-level security context
*/}}
{{- define "todo-app.podSecurityContext" -}}
runAsNonRoot: true
seccompProfile:
  type: RuntimeDefault
{{- end }}
