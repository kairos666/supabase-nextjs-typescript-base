import { useState, useEffect } from 'react';
import { supabase } from 'utils/supabaseClient';

export default function Account({ session }:any) {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState(null);
    const [website, setWebsite] = useState(null);
    const [avatar_url, setAvatarUrl] = useState(null);

    async function getProfile() {
        try {
            setLoading(true);
            const user:any = supabase.auth.user();

            let { data, error, status } = await supabase
                .from('profiles')
                .select(`username, website, avatar_url`)
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username);
                setWebsite(data.website);
                setAvatarUrl(data.avatar_url);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile({ username, website, avatar_url }: any) {
        try {
            setLoading(true)
            const user:any = supabase.auth.user();

            const updates = {
                id: user.id,
                username,
                website,
                avatar_url,
                updated_at: new Date(),
            };

            let { error } = await supabase.from('profiles').upsert(updates, {
                returning: 'minimal', // Don't return the value after inserting
            });

            if (error) {
                throw error;
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => (getProfile() as any), [session]);

    return (
        <div className="form-widget">
            <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="text" value={session.user.email} disabled />
            </div>
            <div>
                <label htmlFor="username">Name</label>
                <input
                    id="username"
                    type="text"
                    value={username || ''}
                    onChange={(e) => setUsername((e as any).target.value)}
                />
            </div>
            <div>
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    type="website"
                    value={website || ''}
                    onChange={(e) => setWebsite((e as any).target.value)}
                />
            </div>

            <div>
                <button
                    className="button block primary"
                    onClick={() => updateProfile({ username, website, avatar_url })}
                    disabled={loading}
                >
                    {loading ? 'Loading ...' : 'Update'}
                </button>
            </div>

            <div>
                <button className="button block" onClick={() => supabase.auth.signOut()}>Sign Out</button>
            </div>
        </div>
    )
}
