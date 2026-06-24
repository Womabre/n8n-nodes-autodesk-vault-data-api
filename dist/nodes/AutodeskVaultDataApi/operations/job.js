"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = void 0;
exports.formatJobBody = formatJobBody;
async function formatJobBody(requestOptions) {
    var _a;
    const jobType = this.getNodeParameter('jobType', 0);
    const priority = this.getNodeParameter('priority', 0);
    const description = this.getNodeParameter('description', 0);
    const paramsCollection = this.getNodeParameter('params', 0);
    const body = {};
    if (jobType)
        body.jobType = jobType;
    if (priority !== '' && priority !== undefined)
        body.priority = priority;
    if (description)
        body.description = description;
    if ((_a = paramsCollection === null || paramsCollection === void 0 ? void 0 : paramsCollection.parameter) === null || _a === void 0 ? void 0 : _a.length)
        body.params = paramsCollection.parameter;
    requestOptions.body = body;
    return requestOptions;
}
exports.operations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['jobs'],
            },
        },
        options: [
            {
                name: 'Create Job',
                value: 'addJob',
                action: 'Create job',
                description: 'Add a new job into the job queue for a given Vault',
                routing: {
                    send: {
                        preSend: [formatJobBody],
                    },
                    request: {
                        method: 'POST',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs',
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Get Job',
                value: 'getJobsById',
                action: 'Get job',
                description: 'Returns the job details for the specified job ID in the given Vault',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs/{{$parameter["jobId"]}}',
                    },
                },
            },
            {
                name: 'Get Job Queue Status',
                value: 'getJobQueueEnabled',
                action: 'Get job queue status',
                description: 'Returns a boolean indicating whether the job queue is enabled for the specified Vault',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs/job-queue-enabled',
                    },
                },
            },
        ],
        default: 'addJob',
    },
];
//# sourceMappingURL=job.js.map