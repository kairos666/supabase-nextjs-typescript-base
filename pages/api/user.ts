import { Session, User } from '@supabase/gotrue-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import logger from 'serverUtils/logger';
import { supabase } from 'serverUtils/supabaseClient';

interface UserSignUp {
    email: string,
    password: string
}

interface Profile {
    id: string,
    username: string,
    website?: string,
    avatar_url?: string
}

async function createUser(user:UserSignUp):Promise<{ error:any, data: Session|User }> {
    const { error, data } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
    });

    if (error) logger.error(`createUser (${user.email}`, error.message);

    if (data) logger.debug(`createUser (${user.email})`);
    
    return { data, error };
}

async function getAllUsers() {
    let { data, error, status } = await supabase
        .from('profiles')
        .select(`*`);

    if (error && status !== 406) logger.error('getAllUsers', status, error.message);

    if (data) logger.debug('getAllUsers response', status);
    
    return { data, error, status };
}

async function getUserById(userId:string) {
    let { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', userId)
        .single();

    if (error && status !== 406) logger.error(`getUserById(${userId})`, status, error.message);

    if (data) logger.debug(`getUserById(${userId})`, status);
    
    return { data, error, status };
}

async function createProfile(profile:Profile) {
    /* must use existing user ID (foreign key constraint) */
    let { data, error, status } = await supabase
        .from('profiles')
        .insert(profile);

    if (error && status !== 406) logger.error(`createProfile (${profile.username}, ID: ${ profile.id })`, status, error.message);

    if (data) logger.debug(`createProfile (${profile.username}, ID: ${ profile.id })`, status);
    
    return { data, error, status };
}

async function createUserAndProfile(email: string, password: string, username: string, website?: string, avatar_url?: string) {
    // USER CREATION
    const { error: userError, data: createdUser } = await createUser({ email, password });
    if (userError) return { status: 500, error: userError, data: createdUser };

    // PROFILE CREATION
    const draftProfile:Profile = { id: (createdUser as User).id, username };
    if(website) draftProfile.website = website;
    if(avatar_url) draftProfile.avatar_url = avatar_url;
    const { error, data, status } = await createProfile(draftProfile);

    return { data, error, status };
}

async function updateProfileById(id:string, profileMutations:any) {
    let { data, error, status } = await supabase
        .from('profiles')
        .update(profileMutations)
        .match({ id });

    if (error && status !== 406) logger.error(`updateProfileById(${id})`, status, error.message);

    if (data) logger.debug(`updateProfileById(${id})`, status);
    
    return { data, error, status };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
    const method = req.method;
    const { id } = req.query;
    const parsedBody = ['POST', 'PUT', 'DELETE'].includes(method) ? JSON.parse(req.body) : {};
    const emptyBody:boolean = (parsedBody && Object.keys(parsedBody).length === 0 && Object.getPrototypeOf(parsedBody) === Object.prototype);

    // GET USERS
    switch(true) {
        case (method === 'GET' && id !== undefined):
            const profile = await getUserById(<string>id);
            res.status(profile.status).json(profile);
            break;

        case (method === 'GET'):
            const profiles = await getAllUsers();
            res.status(profiles.status).json(profiles);
            break;

        case (method === 'POST' && parsedBody.username !== undefined && parsedBody.email !== undefined && parsedBody.password !== undefined):
            const createdProfile = await createUserAndProfile(parsedBody.email, parsedBody.password, parsedBody.username, parsedBody.website, parsedBody.avatar_url);
            res.status(createdProfile.status).json(createdProfile);
            break;

        case (method === 'PUT' && id !== undefined && !emptyBody):
            const updatedProfile = await updateProfileById(<string>id, parsedBody);
            res.status(updatedProfile.status).json(updatedProfile);
            break;

        default:
            const errorMsg = `User service: non supported request`;
            logger.warn(errorMsg);
            res.status(400).send(errorMsg);
    }
}
