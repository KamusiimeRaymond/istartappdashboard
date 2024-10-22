const express = require('express');
const router = express.Router();

const qr = require("qrcode");
const fs = require('fs');
const path = require('path');

const FormData = require('form-data');
const multer = require('multer');
const upload = multer(); // Initialize multer to handle file uploads

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// LOGIN ROUTES //
router.get('/', (req, res) => {
    res.render('login');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.use((req, res, next) => {
    if (req.method === 'GET' && req.path !== '/login') {
        res.redirect('/login');
    } else {
        next();
    }
});

router.post('/login', (req, res) => {
    const fetch = require('node-fetch');
    const {
        email,
        password
    } = req.body;
    const formbody = {
        "email": email,
        "password": password
    };
    fetch('https://istartappapi.up.railway.app/api/admin/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },   
        body: JSON.stringify(formbody), 
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const token = responseJson.token;
            res.render( 'dashwelcome', {token});
        } else {
            const status = "notupdated";
            res.render( 'login', {status,message: "Please check your login details and try again."});
        }
    })  
    .catch((error) => {
        console.error(error);
        res.render('login', { message: 'Please check your internet and try again' });
    });  
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN DASHBOARD SUMMARY//
router.post('/gotodashboardstats', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/stats', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const stats = responseJson;
            const projectcategorystats = responseJson.projectcategorystats
            res.render( 'index', {stats,projectcategorystats,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Please check your login details and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// GRANT CALLS //
router.post('/gotograntcalls', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/grantcalls', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const grantcalls = responseJson.grantcalls;
            res.render( 'grantcalls', {grantcalls,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Unable to get grant calls. Please try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

router.post('/viewgrantcall', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        grantcallId
    } = req.body;
    fetch(`https://istartappapi.up.railway.app/api/grantcalls/${grantcallId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const grantcall = responseJson.grantcall;
            res.render( 'grantcall', {grantcall,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,token,message: "Unable to get grant call. Please check your internet and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
    });
});

router.post('/updategrantcall', upload.fields([{ name: 'grantProfileImage' }, { name: 'grantImage' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        grantcallId,
        name,
        location,
        shortDescription,
        longDescription,
        eligibility,
        instructions,
        weblink,
        startDate,
        endDate,
        status,
        category,
        grantNo
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('eligibility', eligibility);
    form.append('instructions', instructions);
    form.append('link', weblink);

    if(startDate){
        const formattedStartDate = formatDate(startDate);
        form.append('startDate', formattedStartDate);
    }
    if(endDate){
        const formattedEndDate = formatDate(endDate);
        form.append('endDate', formattedEndDate);
    }

    form.append('status', status);
    form.append('category', category);
    form.append('grantNo', grantNo);

    if (req.files['grantProfileImage']) {
        form.append('grantProfileImage', req.files['grantProfileImage'][0].buffer, {
            filename: req.files['grantProfileImage'][0].originalname,
            contentType: req.files['grantProfileImage'][0].mimetype
        });
    }

    if (req.files['grantImage']) {
        form.append('grantImage', req.files['grantImage'][0].buffer, {
            filename: req.files['grantImage'][0].originalname,
            contentType: req.files['grantImage'][0].mimetype
        });
    }
    
    fetch(`https://istartappapi.up.railway.app/api/grantcalls/${grantcallId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message === 'updated') {
            fetch(`https://istartappapi.up.railway.app/api/grantcalls/${grantcallId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const grantcall = responseJson.grantcall;
                    res.render( 'grantcall', {grantcall,message:'Updated grant call successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get grant call. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update grant call. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/gotoaddgrantcallform', (req, res) => {
    const {
        token
    } = req.body;
    res.render('addgrantcall',{token});
});

router.post('/addgrantcall', upload.fields([{ name: 'grantProfileImage' }, { name: 'grantImage' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        name,
        location,
        shortDescription,
        longDescription,
        eligibility,
        instructions,
        weblink,
        startDate,
        endDate,
        status,
        category
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('eligibility', eligibility);
    form.append('instructions', instructions);
    form.append('link', weblink);

    if(startDate){
        const formattedStartDate = formatDate(startDate);
        form.append('startDate', formattedStartDate);
    }
    if(endDate){
        const formattedEndDate = formatDate(endDate);
        form.append('endDate', formattedEndDate);
    }

    form.append('status', status);
    form.append('category', category);
    
    if (req.files['grantProfileImage']) {
        form.append('grantProfileImage', req.files['grantProfileImage'][0].buffer, {
            filename: req.files['grantProfileImage'][0].originalname,
            contentType: req.files['grantProfileImage'][0].mimetype
        });
    }

    if (req.files['grantImage']) {
        form.append('grantImage', req.files['grantImage'][0].buffer, {
            filename: req.files['grantImage'][0].originalname,
            contentType: req.files['grantImage'][0].mimetype
        });
    }
    
    fetch(`https://istartappapi.up.railway.app/api/grantcalls/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message === 'created') {
            fetch(`https://istartappapi.up.railway.app/api/grantcalls/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const grantcalls = responseJson.grantcalls;
                    const status = "success";
                    res.render( 'grantcalls', {grantcalls,message:"Grant call has been added successfully.",status,token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to add grant call. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update grant call. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/deletegrantcall', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        grantcallId
    } = req.body

    fetch(`https://istartappapi.up.railway.app/api/grantcalls/${grantcallId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'deleted') {
            fetch(`https://istartappapi.up.railway.app/api/grantcalls`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const grantcalls = responseJson.grantcalls;
                    const status = "updated"
                    res.render( 'grantcalls', {grantcalls,status,message:'Deleted grant call successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to delete grant call. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Unable to perform delete. Please check your internet and try again' });
            });
        } else {
            const status = 'notupdated';
            res.render('dashwelcome', { status, token, message: 'Unable to delete grant call. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        const status = 'notupdated';
        res.render('dashwelcome', { status, token, message: 'Please check your internet and try again.' });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// PARTNERS //
router.post('/gotopartners', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/partners', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const partners = responseJson.partners;
            res.render( 'partners', {partners,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Unable to get partners. Please try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

router.post('/viewpartner', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        partnerId
    } = req.body;
    fetch(`https://istartappapi.up.railway.app/api/partners/${partnerId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const partner = responseJson.partner;
            res.render( 'partner', {partner,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,token,message: "Unable to get partner. Please check your internet and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
    });
});

router.post('/updatepartner', upload.fields([{ name: 'imageIcon' }, { name: 'imageUrl' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        partnerId,
        name,
        location,
        country,
        description,
        type
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('description', description);
    form.append('type', type);
    form.append('country', country);
    
    if (req.files['imageIcon']) {
        form.append('imageIcon', req.files['imageIcon'][0].buffer, {
            filename: req.files['imageIcon'][0].originalname,
            contentType: req.files['imageIcon'][0].mimetype
        });
    }

    if (req.files['imageUrl']) {
        form.append('imageUrl', req.files['imageUrl'][0].buffer, {
            filename: req.files['imageUrl'][0].originalname,
            contentType: req.files['imageUrl'][0].mimetype
        });
    }
    
    fetch(`https://istartappapi.up.railway.app/api/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'updated') {
            fetch(`https://istartappapi.up.railway.app/api/partners/${partnerId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const partner = responseJson.partner;
                    const status = "updated";
                    res.render( 'partner', {partner,status,message:'Updated partner successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get partner. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update partner. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/gotoaddpartnerform', (req, res) => {
    const {
        token
    } = req.body;
    res.render('addpartner',{token});
});

router.post('/addpartner', upload.fields([{ name: 'imageIcon' }, { name: 'imageUrl' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        name,
        location,
        country,
        description,
        type
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('description', description);
    form.append('country', country);
    form.append('type', type);
    
    if (req.files['imageIcon']) {
        form.append('imageIcon', req.files['imageIcon'][0].buffer, {
            filename: req.files['imageIcon'][0].originalname,
            contentType: req.files['imageIcon'][0].mimetype
        });
    }

    if (req.files['imageUrl']) {
        form.append('imageUrl', req.files['imageUrl'][0].buffer, {
            filename: req.files['imageUrl'][0].originalname,
            contentType: req.files['imageUrl'][0].mimetype
        });
    }
    
    fetch(`https://istartappapi.up.railway.app/api/partners/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'created') {
            fetch(`https://istartappapi.up.railway.app/api/partners/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const partners = responseJson.partners;
                    const status = "updated";
                    res.render( 'partners', {partners,status,token,message:"Partner has been added successfully."});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to add partner. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to add partner. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/deletepartner', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        partnerId
    } = req.body

    fetch(`https://istartappapi.up.railway.app/api/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'deleted') {
            fetch(`https://istartappapi.up.railway.app/api/partners`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const partners = responseJson.partners;
                    const status = "updated"
                    res.render( 'partners', {partners,status,message:'Deleted partner successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to delete partner. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Unable to perform delete. Please check your internet and try again' });
            });
        } else {
            const status = 'notupdated';
            res.render('dashwelcome', { status, token, message: 'Unable to delete partner. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        const status = 'notupdated';
        res.render('dashwelcome', { status, token, message: 'Please check your internet and try again.' });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// MENTORSHIPS //
router.post('/gotomentorships', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/mentorships', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const mentorships = responseJson.mentorships;
            res.render( 'mentorships', {mentorships,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Unable to get mentorships. Please try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

router.post('/viewmentorship', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        mentorshipId
    } = req.body;
    fetch(`https://istartappapi.up.railway.app/api/mentorships/${mentorshipId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const mentorship = responseJson.mentorship;
            res.render( 'mentorship', {mentorship,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,token,message: "Unable to get mentorship. Please check your internet and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
    });
});

router.post('/updatementorship', upload.fields([{ name: 'programIcon' }, { name: 'programImage' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        mentorshipId,
        name,
        location,
        country,
        shortDescription,
        longDescription,
        entryStatus,
        startDate,
        duration
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('country', country);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('entryStatus', entryStatus);
    if(startDate){
        const formattedStartDate = formatDate(startDate);
        form.append('startDate', formattedStartDate);
    }
    form.append('duration', duration);
    
    if (req.files['programIcon']) {
        form.append('programIcon', req.files['programIcon'][0].buffer, {
            filename: req.files['programIcon'][0].originalname,
            contentType: req.files['programIcon'][0].mimetype
        });
    }

    if (req.files['programImage']) {
        form.append('programImage', req.files['programImage'][0].buffer, {
            filename: req.files['programImage'][0].originalname,
            contentType: req.files['programImage'][0].mimetype
        });
    }

    fetch(`https://istartappapi.up.railway.app/api/mentorships/${mentorshipId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'updated') {
            fetch(`https://istartappapi.up.railway.app/api/mentorships/${mentorshipId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const mentorship = responseJson.mentorship;
                    const status = "updated";
                    res.render( 'mentorship', {mentorship,status,message:'Updated mentorship successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get mentorship. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update mentorship. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/gotoaddmentorshipform', (req, res) => {
    const {
        token
    } = req.body;
    res.render('addmentorship',{token});
});

router.post('/addmentorship', upload.fields([{ name: 'programIcon' }, { name: 'programImage' }]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        name,
        location,
        country,
        shortDescription,
        startDate,
        longDescription,
        entryStatus,
        duration
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('location', location);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('country', country);
    form.append('entryStatus', entryStatus);
    form.append('duration', duration);
    if(startDate){
        const formattedStartDate = formatDate(startDate);
        form.append('startDate', formattedStartDate);
    }
    
    if (req.files['programIcon']) {
        form.append('programIcon', req.files['programIcon'][0].buffer, {
            filename: req.files['programIcon'][0].originalname,
            contentType: req.files['programIcon'][0].mimetype
        });
    }

    if (req.files['programImage']) {
        form.append('programImage', req.files['programImage'][0].buffer, {
            filename: req.files['programImage'][0].originalname,
            contentType: req.files['programImage'][0].mimetype
        });
    }
    
    fetch(`https://istartappapi.up.railway.app/api/mentorships/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'created') {
            fetch(`https://istartappapi.up.railway.app/api/mentorships/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const mentorships = responseJson.mentorships;
                    const status = "updated";
                    res.render( 'mentorships', {mentorships,status,token,message:"Partner has been added successfully."});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to add partner. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to add partner. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/deletementorship', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        mentorshipsId
    } = req.body

    fetch(`https://istartappapi.up.railway.app/api/mentorships/${mentorshipsId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'deleted') {
            fetch(`https://istartappapi.up.railway.app/api/mentorships/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const mentorships = responseJson.mentorships;
                    const status = "updated";
                    res.render( 'mentorships', {mentorships,status,token,message:"Mentorship has been added successfully."});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to add mentorship. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            const status = 'notupdated';
            res.render('dashwelcome', { status, token, message: 'Unable to delete mentorship. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        const status = 'notupdated';
        res.render('dashwelcome', { status, token, message: 'Please check your internet and try again.' });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// PROJECTS //
router.post('/gotoprojects', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/projects', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const projects = responseJson.projects;
            res.render( 'projects', {projects,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Unable to get projects. Please try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

router.post('/viewproject', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        projectId
    } = req.body;
    fetch(`https://istartappapi.up.railway.app/api/projects/${projectId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const project = responseJson.project;
            res.render( 'project', {project,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,token,message: "Unable to get project. Please check your internet and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
    });
});

router.post('/updateproject', 
    upload.fields([
        { name: 'logoImage' }, 
        { name: 'mainImage' },
        { name: 'gallery1' },
        { name: 'gallery2' },
        { name: 'gallery3' },
        { name: 'gallery4' }
    ]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        projectId,
        name,
        industry,
        subIndustry,
        location,
        founders,
        overview,
        biography,
        achievements,
        skills,
        investment,
        team,
        country,
        userNo,
        yearOfRegistration,
        contact,
        alternativeContact,
        projectNo
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('industry', industry);
    form.append('subIndustry', subIndustry);
    form.append('location', location);
    form.append('founders', founders);
    form.append('overview', overview);
    form.append('biography', biography);
    form.append('achievements', achievements);
    form.append('skills', skills);
    form.append('investment', investment);
    form.append('team', team);
    form.append('country', country);
    form.append('userNo', userNo);
    form.append('yearOfRegistration', yearOfRegistration);
    form.append('contact', contact);
    form.append('alternativeContact', alternativeContact);
    form.append('projectNo', projectNo);
    
    if (req.files['logoImage']) {
        form.append('logoImage', req.files['logoImage'][0].buffer, {
            filename: req.files['logoImage'][0].originalname,
            contentType: req.files['logoImage'][0].mimetype
        });
    }
    if (req.files['mainImage']) {
        form.append('mainImage', req.files['mainImage'][0].buffer, {
            filename: req.files['mainImage'][0].originalname,
            contentType: req.files['mainImage'][0].mimetype
        });
    }
    if (req.files['gallery1']) {
        form.append('gallery1', req.files['gallery1'][0].buffer, {
            filename: req.files['gallery1'][0].originalname,
            contentType: req.files['gallery1'][0].mimetype
        });
    }
    if (req.files['gallery2']) {
        form.append('gallery2', req.files['gallery2'][0].buffer, {
            filename: req.files['gallery2'][0].originalname,
            contentType: req.files['gallery2'][0].mimetype
        });
    }
    if (req.files['gallery3']) {
        form.append('gallery3', req.files['gallery3'][0].buffer, {
            filename: req.files['gallery3'][0].originalname,
            contentType: req.files['gallery3'][0].mimetype
        });
    }
    if (req.files['gallery4']) {
        form.append('gallery4', req.files['gallery4'][0].buffer, {
            filename: req.files['gallery4'][0].originalname,
            contentType: req.files['gallery4'][0].mimetype
        });
    }

    fetch(`https://istartappapi.up.railway.app/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'updated') {
            fetch(`https://istartappapi.up.railway.app/api/projects/${projectId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const project = responseJson.project;
                    const status = "updated";
                    res.render( 'project', {project,status,message:'Updated project successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get project. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update project. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/gotoaddprojectform', (req, res) => {
    const {
        token
    } = req.body;
    res.render( 'addproject', {token});
});

router.post('/addproject', 
    upload.fields([
        { name: 'logoImage' }, 
        { name: 'mainImage' },
        { name: 'gallery1' },
        { name: 'gallery2' },
        { name: 'gallery3' },
        { name: 'gallery4' }
    ]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        name,
        industry,
        subIndustry,
        location,
        founders,
        overview,
        biography,
        achievements,
        skills,
        investment,
        team,
        country,
        userNo,
        yearOfRegistration,
        contact,
        alternativeContact,
    } = req.body

    const views = 0;
    const rating = 0;
    const likes = 0;

    const form = new FormData();
    form.append('name', name);
    form.append('industry', industry);
    form.append('subIndustry', subIndustry);
    form.append('location', location);
    form.append('founders', founders);
    form.append('overview', overview);
    form.append('biography', biography);
    form.append('achievements', achievements);
    form.append('skills', skills);
    form.append('investment', investment);
    form.append('team', team);
    form.append('views', views);
    form.append('rating', rating);
    form.append('likes', likes);
    form.append('country', country);
    form.append('userNo', userNo);
    form.append('yearOfRegistration', yearOfRegistration);
    form.append('contact', contact);
    form.append('alternativeContact', alternativeContact);
    
    if (req.files['logoImage']) {
        form.append('logoImage', req.files['logoImage'][0].buffer, {
            filename: req.files['logoImage'][0].originalname,
            contentType: req.files['logoImage'][0].mimetype
        });
    }
    if (req.files['mainImage']) {
        form.append('mainImage', req.files['mainImage'][0].buffer, {
            filename: req.files['mainImage'][0].originalname,
            contentType: req.files['mainImage'][0].mimetype
        });
    }
    if (req.files['gallery1']) {
        form.append('gallery1', req.files['gallery1'][0].buffer, {
            filename: req.files['gallery1'][0].originalname,
            contentType: req.files['gallery1'][0].mimetype
        });
    }
    if (req.files['gallery2']) {
        form.append('gallery2', req.files['gallery2'][0].buffer, {
            filename: req.files['gallery2'][0].originalname,
            contentType: req.files['gallery2'][0].mimetype
        });
    }
    if (req.files['gallery3']) {
        form.append('gallery3', req.files['gallery3'][0].buffer, {
            filename: req.files['gallery3'][0].originalname,
            contentType: req.files['gallery3'][0].mimetype
        });
    }
    if (req.files['gallery4']) {
        form.append('gallery4', req.files['gallery4'][0].buffer, {
            filename: req.files['gallery4'][0].originalname,
            contentType: req.files['gallery4'][0].mimetype
        });
    }

    fetch(`https://istartappapi.up.railway.app/api/projects/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'created') {
            fetch('https://istartappapi.up.railway.app/api/projects', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const projects = responseJson.projects;
                    const status = "updated"
                    res.render( 'projects', {projects,status,message:"Added project successfully",token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,message: "Added project but unable to get projects. Please try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to add project. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to add project. Please check your internet and try again.' });
    });
});

router.post('/deleteproject', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        projectId
    } = req.body

    fetch(`https://istartappapi.up.railway.app/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'deleted') {
            fetch(`https://istartappapi.up.railway.app/api/projects/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const projects = responseJson.projects;
                    const status = "updated";
                    res.render( 'projects', {projects,status,token,message:"Project has been added successfully."});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get projects. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            const status = 'notupdated';
            res.render('dashwelcome', { status, token, message: 'Unable to delete project. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        const status = 'notupdated';
        res.render('dashwelcome', { status, token, message: 'Please check your internet and try again.' });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////
// HELPFULTIPS //
router.post('/gotohelpfultips', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token
    } = req.body;
    fetch('https://istartappapi.up.railway.app/api/helpfultips', {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const helpfultips = responseJson.helpfultips;
            res.render( 'helpfultips', {helpfultips,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,message: "Unable to get helpful tips. Please try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,message: 'Please check your internet and try again' });
    });
});

router.post('/gotoaddhelpfultipform', (req, res) => {
    const {
        token
    } = req.body;
    res.render( 'addhelpfultip', {token});
});

router.post('/viewhelpfultip', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        helpfultipId
    } = req.body;
    fetch(`https://istartappapi.up.railway.app/api/helpfultips/${helpfultipId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message == "success") {
            const helpfultip = responseJson.helpfultip;
            res.render( 'helpfultip', {helpfultip,token});
        } else {
            const status = "notupdated";
            res.render( 'dashwelcome', {status,token,message: "Unable to get helpful tip. Please check your internet and try again."});
        }
    })
    .catch((error) => {
        console.error(error);
        const status = "notupdated";
        res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
    });
});

router.post('/updatehelpfultip', 
    upload.fields([
        { name: 'authorImage' }, 
        { name: 'helpfulTipCoverImage' }
    ]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        helpfultipId,
        name,
        author,
        shortDescription,
        longDescription,
        link
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('author', author);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('link', link);
    
    if (req.files['authorImage']) {
        form.append('authorImage', req.files['authorImage'][0].buffer, {
            filename: req.files['authorImage'][0].originalname,
            contentType: req.files['authorImage'][0].mimetype
        });
    }
    if (req.files['helpfulTipCoverImage']) {
        form.append('helpfulTipCoverImage', req.files['helpfulTipCoverImage'][0].buffer, {
            filename: req.files['helpfulTipCoverImage'][0].originalname,
            contentType: req.files['helpfulTipCoverImage'][0].mimetype
        });
    }

    fetch(`https://istartappapi.up.railway.app/api/helpfultips/${helpfultipId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'updated') {
            fetch(`https://istartappapi.up.railway.app/api/helpfultips/${helpfultipId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const helpfultip = responseJson.helpfultip;
                    const status = "updated";
                    res.render( 'helpfultip', {helpfultip,status,message:'Updated helpful tip successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get helpful tip. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to update helpful tip. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

router.post('/deletehelpfultip', (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        helpfultipId
    } = req.body

    fetch(`https://istartappapi.up.railway.app/api/helpfultips/${helpfultipId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'deleted') {
            fetch(`https://istartappapi.up.railway.app/api/helpfultips/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const projects = responseJson.projects;
                    const status = "updated";
                    res.render( 'projects', {projects,status,token,message:"Helpful tip has been added successfully."});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to get helpful tips. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            const status = 'notupdated';
            res.render('dashwelcome', { status, token, message: 'Unable to delete helpful tip. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        const status = 'notupdated';
        res.render('dashwelcome', { status, token, message: 'Please check your internet and try again.' });
    });
});

router.post('/addhelpfultip', 
    upload.fields([
        { name: 'authorImage' }, 
        { name: 'helpfulTipCoverImage' }
    ]), (req, res) => {
    const fetch = require('node-fetch');
    const {
        token,
        name,
        author,
        shortDescription,
        longDescription,
        link
    } = req.body

    const form = new FormData();
    form.append('name', name);
    form.append('author', author);
    form.append('shortDescription', shortDescription);
    form.append('longDescription', longDescription);
    form.append('link', link);
    
    if (req.files['authorImage']) {
        form.append('authorImage', req.files['authorImage'][0].buffer, {
            filename: req.files['authorImage'][0].originalname,
            contentType: req.files['authorImage'][0].mimetype
        });
    }
    if (req.files['helpfulTipCoverImage']) {
        form.append('helpfulTipCoverImage', req.files['helpfulTipCoverImage'][0].buffer, {
            filename: req.files['helpfulTipCoverImage'][0].originalname,
            contentType: req.files['helpfulTipCoverImage'][0].mimetype
        });
    }

    fetch(`https://istartappapi.up.railway.app/api/helpfultips/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
        },
        body: form
    })
    .then(response => response.json())
    .then(responseJson => {
        if (responseJson.message == 'created') {
            fetch(`https://istartappapi.up.railway.app/api/helpfultips/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message == "success") {
                    const helpfultips = responseJson.helpfultips;
                    const status = "updated";
                    res.render( 'helpfultips', {helpfultips,status,message:'Added helpful tip successfully',token});
                } else {
                    const status = "notupdated";
                    res.render( 'dashwelcome', {status,token,message: "Unable to add helpful tip. Please check your internet and try again."});
                }
            })
            .catch((error) => {
                console.error(error);
                const status = "notupdated";
                res.render('dashwelcome', { status,token,message: 'Please check your internet and try again' });
            });
        } else {
            res.render('dashwelcome', { status: 'notupdated', token, message: 'Unable to add helpful tip. Please try again.' });
        }
    })
    .catch(error => {
        console.error(error);
        res.render('dashwelcome', { status: 'notupdated', token, message: 'Please check your internet and try again.' });
    });
});

module.exports = router;