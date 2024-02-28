async function getForm(url = "") {
    const response = await fetch(url, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: 'cors',
        cache: "no-cache",
        credentials: "omit",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer",
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

const createEle = (name = "div") => {
    return document.createElement(name);
}

const validate = (field, regexPattern) => {
    let regex = new RegExp(regexPattern);
    const valid = regex.test(field.value);
    let validEle = document.querySelector('#lead-db-form form .input-wrapping .input-error[data-for="' + field.id + '"]');
    if (valid) {
        field.className = "valid";
        validEle.style.display = 'none';
    } else {
        field.className = "invalid";
        validEle.style.display = 'block';
    }
};

const FieldDOMBuild = (form, data) => {

    let wrappingEle = createEle("div");
    wrappingEle.className = "input-wrapping";

    //Label
    let label = createEle("label");
    label.htmlFor = data.key;
    label.innerHTML = data.name;

    if (data.required) {
        //Require Symbol
        let requireSymbol = createEle("span");
        requireSymbol.className = 'require-symbol';
        requireSymbol.innerHTML = '*';

        label.appendChild(requireSymbol);
    }

    wrappingEle.appendChild(label);

    //Input
    let formFieldEle= createEle("input");
    formFieldEle.type = data.validationType;
    formFieldEle.name = data.key;
    formFieldEle.id = data.key;
    formFieldEle.required = data.required;
    formFieldEle.placeholder = data.name;
    formFieldEle.dataset.id = data.id;
    wrappingEle.appendChild(formFieldEle);

    //validation
    let validation = createEle("div");
    validation.className = 'input-error';
    validation.style.display = 'none';
    validation.innerHTML = 'Please fill out the information completely.';
    validation.dataset.for = data.key;
    wrappingEle.appendChild(validation);

    if (data.validationSyntax !== "" && data.validationSyntax !== null) {
        formFieldEle.addEventListener('keyup', (e) => {
            validate(e.target, data.validationSyntax);
        });
    }

    form.appendChild(wrappingEle)

    return form;
}

const FormBtnDOMBuild = (form, type = 'submit', text = 'Submit') => {
    if (form !== null) {

        let wrappingEle = createEle("div");
        wrappingEle.className = "input-half-wrapping";

        let btn= createEle("input");
        btn.setAttribute("type", type);
        btn.setAttribute("value", text);

        wrappingEle.appendChild(btn);
        form.appendChild(wrappingEle);
    }

    return form;
}

const submitHandler = async (form, userUUID) => {
    let data = new FormData(form);
    let object = {
        user_uuid: userUUID
    };

    data.forEach(function(value, key){
        object[key] = value;
    });

    try {
        const res = await fetch(
            form.getAttribute('action'),
            {
                mode: 'cors',
                method: 'POST',
                headers: {
                    "Content-Type": "application/json; charset=utf8",
                },
                body: JSON.stringify(object),
            },
        );

        const resData = await res.json();

        console.log(resData);
    } catch (err) {
        console.log(err.message);
    }
}

const DOMBuild = (data, submit_url, lead_db_form_id, userUUID) => {
    let formEle = createEle("form");
    formEle.name = "leadDBForm" + lead_db_form_id;
    formEle.method = "post";
    formEle.action = submit_url;

    for (let i = 0; i < data.length; i++) {
        let field = data[i];
        FieldDOMBuild(formEle, field);
    }

    formEle.appendChild(createEle("hr"));
    FormBtnDOMBuild(formEle, "reset", "Clear");
    FormBtnDOMBuild(formEle, "submit", "Submit");

    formEle.addEventListener('submit', async event => {
        event.preventDefault();
        submitHandler(formEle, userUUID);
    });

    return formEle;
}

const styleBuild = (path) => {
    fetch(path, { mode: 'cors' })
        .then((res) => {
            if (res.status === 200) {
                return res.text();
            }
            return null;
        })
        .then((text) => {
            if (text){
                let headEle = document.getElementsByTagName('head');
                if (headEle) {
                    let styleEle = createEle("style");
                    styleEle.innerHTML = text;
                    headEle[0].appendChild(styleEle);
                }
            }
        })
        .catch((e) => console.error(e));
}

const scriptBuild = (path) => {
    let scriptEle = createEle('script');
    scriptEle.setAttribute('src', path);
    scriptEle.setAttribute('for', "leaddb");
    scriptEle.setAttribute('charset', "utf-8");
    document.head.appendChild(scriptEle);
}

const spinnerBuild = (rootEle) => {
    let spinnerScreenEle = createEle('div');
    spinnerScreenEle.id = "loader-screen";

    let spinnerEle = createEle('div');
    spinnerEle.className = "loader";

    spinnerScreenEle.appendChild(spinnerEle);

    rootEle.appendChild(spinnerScreenEle);
}

const spinnerHandle = (isShow) => {
    let spinnerScreenEle = document.getElementById('loader-screen');
    if (spinnerScreenEle !== null) {
        if (isShow) {
            spinnerScreenEle.style.display = "flex";
        } else {
            spinnerScreenEle.style.display = "none";
        }
    }
}

const liffGetUserProfile = async () => {
    const profile = await liff.getProfile();
    return profile.userId;
}

const liffInit = async (liff_id) => {
    let user_uuid = null;
    await liff.init({liffId: liff_id, withLoginOnExternalBrowser: true});
    if (liff.isLoggedIn()){
        user_uuid = await liffGetUserProfile();
    } else {
        liff.login();
    }

    console.log(user_uuid);

    return user_uuid;
}

let liffCheckCount = 1;
const liffCheckBreak = 5;
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const liffCheck = async () => {
    if (liffCheckCount <= liffCheckBreak){
        let script_for_leaddb = document.querySelector("script[for=leaddb]");
        if (script_for_leaddb !== null && typeof liff !== "undefined") {
            return true;
        }

        await timeout(1000);
        liffCheckCount++;
        return await liffCheck();
    } else {
        return false;
    }
}

let host = "https://leaddb.iixp.co.th";
let stylePath = "./style.css?v=3";
let scriptPath = "https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js";
let leadDBFormEle = document.getElementById("lead-db-form");

var leaddb =
    (() => {
        const main = (form_id, liff_id) => {

            if (form_id !== null && form_id !== ""){
                spinnerBuild(leadDBFormEle);
                styleBuild(stylePath);
                scriptBuild(scriptPath);

                liffCheckLoopCount = 0;

                liffCheck().then(res => {
                   if (res) {
                       liffInit(liff_id).then((user_uuid) => {
                           getForm(host + "/app/api/field/campaign/" + form_id).then((data) => {
                               if (data.fields.length > 0){

                                   let formDOM = DOMBuild(data.fields, data.submit_url, form_id, user_uuid);
                                   leadDBFormEle.append(formDOM);

                                   spinnerHandle(false);
                               }
                           });
                       });
                   }
                });
            }
        }

        return { "init" : (form_id, liff_id) => main(form_id, liff_id)};
    })();