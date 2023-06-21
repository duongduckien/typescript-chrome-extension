import $ from 'jquery';

class Main {
    constructor() {
        this.init();
    }

    init() {
        $(document).ready(async () => {
            this.resetEmailTable();
            this.hideErrorMessage();
            this.handleLoadEmails();
            this.handleData();
        });
    }

    hideErrorMessage() {
        if ($('#olive-extension__error-msg')[0]) {
            $('#olive-extension__error-msg').removeClass('olive-extension-showing').addClass('olive-extension-hidding');
            $('#olive-extension__error-msg').html();
        }
    }

    showErrorMessage(text: string) {
        if ($('#olive-extension__error-msg')[0]) {
            $('#olive-extension__error-msg').removeClass('olive-extension-hidding').addClass('olive-extension-showing');
            $('#olive-extension__error-msg').html(text);
        }
    }

    resetEmailTable() {
        if ($('#olive-extension__email-table')[0]) {
            $('#olive-extension__email-table').empty();
        }
    }

    validateEmail(email: string) {
        if (email && email !== '') {
            return email.match(
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        }

        return false;
    };

    handleLoadEmails() {
        const t = this;

        $(document).ready(() => {
            $('#olive-extension__btn').on('click', async () => {
                t.hideErrorMessage();

                const tabData = await chrome.tabs.query({ active: true, currentWindow: true });
                const tabId = tabData[0].id;

                const handleCurrentTab = () => {
                    const documentHtml = document.body.innerHTML;
                    const context = documentHtml.toString();
                    const emailsData = context.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                    const emails: string[] = [];

                    if (emailsData && emailsData.length) {
                        for (const item of emailsData) {
                            if (
                                !item.endsWith('.png') &&
                                !item.endsWith('.jpg') &&
                                !item.endsWith('.jpeg') &&
                                !item.endsWith('.gif') &&
                                !item.endsWith('.webp')
                            ) {
                                emails.push(item);
                            }
                        }
                    }

                    if (emails && emails.length) {
                        const temp: string[] = [];

                        let html = `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                    </tr>
                                </thead>

                                <tbody>
                        `;

                        for (const email of emails) {
                            if (!temp.includes(email)) {
                                temp.push(email);

                                html += `
                                    <tr>
                                        <td>${email}</td>
                                    </tr>
                                `;
                            }
                        }

                        html += `
                                </tbody>
                            </table>
                        `;

                        chrome.runtime.sendMessage(chrome.runtime.id, { type: 'EMAIL_TABLE_CONTENT', data: html });
                    } else {
                        chrome.runtime.sendMessage(chrome.runtime.id, { type: 'NO_EMAIL' });
                    }
                }

                if (tabId) {
                    chrome.scripting.executeScript({
                        target: { tabId },
                        func: handleCurrentTab,
                    })
                }
            });
        });
    }

    handleData() {
        chrome.runtime.onMessage.addListener((request, sender) => {
            if (request && request.type) {
                switch (request.type) {
                    case 'EMAIL_TABLE_CONTENT': {
                        $('#olive-extension__email-table').html(request.data);
                        break;
                    }
                    case 'NO_EMAIL': {
                        this.showErrorMessage('No email');
                        break;
                    }
                }
            }
        });
    }
}

new Main();
